/*global document, location, io, XMLHttpRequest, setTimeout, setInterval, StyleFix*/
(function () {
    'use strict';

    var pollTimeout = 2000,
        findCssIncludes = function () {
            var cssIncludes = [],
                links = document.getElementsByTagName('link'),
                styleSheet,
                cssRule,
                i,
                j,
                href,
                isLocal = function (href) {
                    var local = new RegExp("^" + document.location.protocol + "//" + document.location.host.replace(/[\.]/g, '\\$0')),
                        remote = /:\/\/|^\/\//;

                    return local.test(href) || !remote.test(href);
                };

            for (i = 0; i < links.length; i += 1) {
                if (/\bstylesheet\b/i.test(links[i].getAttribute('rel'))) {
                    href = links[i].getAttribute('href');
                    if (isLocal(href)) {
                        cssIncludes.push({type: 'link', href: href, node: links[i]});
                    }
                }
            }

            for (i = 0; i < document.styleSheets.length; i += 1) {
                styleSheet = document.styleSheets[i];
                for (j = 0; j < styleSheet.cssRules.length; j += 1) {
                    cssRule = styleSheet.cssRules[j];
                    if (cssRule.type === 3 && isLocal(cssRule.href)) { // CSSImportRule
                        cssIncludes.push({type: 'import', href: cssRule.href, node: cssRule, styleElement: styleSheet.ownerNode});
                    }
                }
            }

            return cssIncludes;
        },
        removeCacheBuster = function (href) {
            return href.replace(/[?&]livestyle=\d+/, '');
        },
        addCacheBuster = function (href) {
            return href + (href.indexOf('?') === -1 ? '?' : '&') + 'livestyle=' + new Date().getTime();
        },
        refresh = function (href) {
            var cssIncludes = findCssIncludes(),
                i,
                cssInclude,
                cssIncludeHref,
                newHref,
                replacerRegExp,
                freed;

            for (i = 0; i < cssIncludes.length; i += 1) {
                cssInclude = cssIncludes[i];
                cssIncludeHref = removeCacheBuster(cssInclude.href);

                if (cssIncludeHref === href) {
                    newHref = addCacheBuster(href);
                    if (cssInclude.type === 'import') {
                        replacerRegExp = new RegExp("@import\\s+url\\(" + cssInclude.href.replace(/[\?\[\]\(\)\{\}]/g, "\\$&") + "\\)");
                        cssInclude.styleElement.innerHTML = cssInclude.styleElement.innerHTML.replace(replacerRegExp, '@import url(' + newHref + ')');
                    } else {
                        cssInclude.node.setAttribute('href', newHref);
                        if (typeof StyleFix !== 'undefined' && StyleFix.link) { // PrefixFree support http://leaverou.github.com/prefixfree/
                            freed = cssInclude.node.prefixfreed;
                            StyleFix.link(cssInclude.node, true);
                            freed.parentNode.removeChild(freed);
                        }
                    }
                    // Replacing the first occurrence should be good enough. Besides, the @import replacement code invalidates
                    // the rest of the cssIncludes in the same stylesheet.
                    break;
                }
            }
        },
        startListening = function () {
            var socket = io.connect();

            socket.on('connect', function () {
                var hrefs = [],
                    watchNewStylesheets = function () {
                        var cssIncludes = findCssIncludes(),
                            i;

                        for (i = 0; i < cssIncludes.length; i += 1) {
                            if (hrefs.indexOf(cssIncludes[i].href) === -1) {
                                hrefs.push(cssIncludes[i].href);
                            }
                        }

                        socket.emit('watch', hrefs, location.href);
                    };

                watchNewStylesheets();
                setInterval(watchNewStylesheets, pollTimeout);
            }).on('change', refresh);
        },
        state = {},
        startPolling = function () {
            var getXHR = function () {
                    // FIXME: Crossbrowser compatibility
                    return new XMLHttpRequest();
                },
                cssIncludes = findCssIncludes(),
                proceed = function () {
                    var cssInclude,
                        url,
                        xhr;

                    if (cssIncludes.length > 0) {
                        cssInclude = cssIncludes.shift();
                        url = removeCacheBuster(cssInclude.href);
                        xhr = getXHR();

                        xhr.onreadystatechange = function () {
                            var lastModified,
                                etag;

                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    lastModified = Date.parse(xhr.getResponseHeader("Last-Modified"));
                                    etag = xhr.getResponseHeader("ETag");

                                    if (!state[url] || state[url].lastModified < lastModified || state[url].etag !== etag) {
                                        state[url] = {
                                            lastModified: lastModified,
                                            etag: etag
                                        };
                                        refresh(url);
                                    }
                                }

                                proceed();
                            }
                        };
                        xhr.open('HEAD', addCacheBuster(url), true);
                        xhr.send(null);
                    } else {
                        setTimeout(startPolling, pollTimeout);
                    }
                };

            proceed();
        };

    if (typeof io !== 'undefined') {
        startListening();
    } else {
        startPolling();
    }
}());
