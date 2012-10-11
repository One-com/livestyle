/*global document, location, io, XMLHttpRequest, setTimeout, setInterval, clearInterval, StyleFix, less, ActiveXObject*/
(function () {
    'use strict';

    var liveStyleOptions = {}; // The options will be injected by the server

    function log(msg) {
        if (liveStyleOptions.debug && window.console) {
            console.log(msg);
        }
    }

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (o, from) {
            var i;
            for (i = from || 0; i < this.length; i += 1) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    var pollTimeout = 2000,
        changedHrefsQueue = [], // Queue of incoming change events
        isBusyByHref = {},
        escapeRegExp = function (str) {
            return str.replace(/[\.\+\*\{\}\[\]\(\)\?\^\$]/g, '\\$&');
        },
        cleanHref = function (href) {
            if (!href) {
                return false;
            }
            var local = new RegExp(
                '^' + escapeRegExp(document.location.protocol + '//' + document.location.hostname + (document.location.port ? ':' + document.location.port : '')) + '/',
                'i'),
                proxy,
                remote = /:\/\/|^\/\//;

            // Skip things like chrome-extension://hmdcmlfkchdmnmnmheododdhjedfccka/inject/anchor-cursor-default.css?0.2.6
            if (/^[\w\-]+:/.test(href) && !/^https?:/.test(href)) {
                return false;
            }

            if (liveStyleOptions.proxy) {
                proxy = new RegExp('^' + escapeRegExp(liveStyleOptions.proxy), 'i');
                if (proxy.test(href)) {
                    return '/' + href.replace(proxy, '');
                }
            }

            if (!local.test(href) && (/^\/\//.test(href) || /^[a-z0-9\+]+:\/\//i.test(href))) {
                return false;
            }

            if (/^data:/.test(href)) {
                // AdBlock for Chrome injects these
                return false;
            }

            // Normalize to be root relative:
            href = href.replace(local, '').replace(/\?.*$/, '');
            if (!/^\//.test(href)) {
                href = location.pathname.replace(/[^\/]+$/, '') + href;
            }

            // Normalize: /foo/../bar => /bar
            while (/\/[^\/\.][^\/]*\/\.\.\//.test(href)) {
                href = href.replace(/\/[^\/\.][^\/]*\/\.\.\//, '/');
            }

            return href;
        },
        findCssIncludes = function () {
            var cssIncludes = [],
                links = document.getElementsByTagName('link'),
                styles = document.getElementsByTagName('style'),
                style,
                cssRule,
                i,
                href;

            // Link tags with rel="stylesheet"
            for (i = 0; i < links.length; i += 1) {
                if (/\bstylesheet\b/i.test(links[i].getAttribute('rel'))) {
                    href = cleanHref(links[i].getAttribute('href'));
                    if (href) {
                        cssIncludes.push({type: 'link', href: href, node: links[i]});
                    }
                }
            }

            // Look for .compilessinclude {src: url(...);} in non-inline stylesheets:
            for (i = 0 ; i < document.styleSheets.length ; i += 1) {
                var styleSheet = document.styleSheets[i];
                if (styleSheet.href) {
                    for (var j = 0 ; j < styleSheet.cssRules.length ; j += 1) {
                        cssRule = styleSheet.cssRules[j];
                        if (/^\.compilessinclude$/.test(cssRule.selectorText)) {
                            var urlToken = cssRule.style.getPropertyValue('src'),
                                matchUrlToken = urlToken.match(/^url\((['"]|)(.*?)\1\)$/);
                            if (matchUrlToken) {
                                href = cleanHref(styleSheet.href);
                                var watchHref = cleanHref(matchUrlToken[2]);
                                if (href && watchHref) {
                                    cssIncludes.push({type: 'link', href: href, watchHref: watchHref, node: styleSheet.ownerNode});
                                }
                            }
                        } else {
                            // These .compilessinclude rules always come first, so break on the first non-matching one:
                            break;
                        }
                    }
                }
            }

            // Style tags: @includes and inline prefixfree blocks
            for (i = 0 ; i < styles.length ; i += 1) {
                style = styles[i];

                if (typeof StyleFix !== 'undefined') {
                    // Prefixfree support
                    href = cleanHref(style.href || style.getAttribute('data-href'));
                    if (href) {
                        cssIncludes.push({type: 'prefixfree', href: href, node: style});
                    }
                }

                // @import
                style.innerHTML.replace(/@import\s+(?:'([^']+)'|"([^"]+)"|url\(([^\)]+)\))/g, function ($0, singleQuotedHref, doubleQuotedHref, urlParenthesesHref) {
                    if (urlParenthesesHref) {
                        urlParenthesesHref = urlParenthesesHref.replace(/^(['"])(.*)\1$/, '$2');
                    }
                    var href = cleanHref(singleQuotedHref || doubleQuotedHref || urlParenthesesHref);
                    if (href) {
                        cssIncludes.push({type: 'import', href: href, styleElement: style});
                    }
                });
            }

            return cssIncludes;
        },
        removeCacheBuster = function (href) {
            return href.replace(/[?&]livestyle=\d+/, '');
        },
        addCacheBuster = function (href) {
            return href + (href.indexOf('?') === -1 ? '?' : '&') + 'livestyle=' + new Date().getTime();
        },

        // Replaces a link tag with an updated version. Just replacing the href would cause FOUC.
        // We insert the new node before the old one and remove the old one after the new one has loaded.
        replaceLinkTag = function (node, href, watchHref) {
            isBusyByHref[href] = (isBusyByHref[href] || 0) + 1;
            if (watchHref) {
                isBusyByHref[watchHref] = (isBusyByHref[watchHref] || 0) + 1;
            }
            var parent = node.parentNode,
                newNode = node.cloneNode(true),
                monitor;

            newNode.removeAttribute('href');

            // The node must be added to the document before the href is set, otherwise IE9 won't
            // apply the styles.
            if (node.nextSibling) {
                parent.insertBefore(newNode, node.nextSibling);
            } else {
                parent.appendChild(newNode);
            }

            newNode.href = href;
            newNode.onload = function () {
                newNode.onload = null;
                isBusyByHref[href] -= 1;
                if (watchHref) {
                    isBusyByHref[watchHref] -= 1;
                }
                if (node.parentNode) {
                    parent.removeChild(node);
                }
                if (monitor) {
                    clearInterval(monitor);
                    monitor = null;
                }
                // There may be additional occurrences of this href in changedHrefsQueue that can be processed
                // now that the busy counter was decremented:
                processNextChangedHref();
            };
            monitor = setInterval(function () {
                var isReady;
                try {
                    isReady = newNode.sheet && newNode.sheet.cssRules.length > 0; // Throws an error if the stylesheet hasn't loaded
                } catch (err) {}
                if (isReady) {
                    newNode.onload();
                }
            }, 20);
        },
        replaceStyleTag = function (node, oldHref, href) {
            var parent = node.parentNode,
                newNode = node.cloneNode(),
                replacerRegexp = new RegExp("@import\\s+url\\([\"']?" + oldHref.replace(/[\?\[\]\(\)\{\}]/g, "\\$&") + "[\"']?\\)");

            newNode.textContent = node.textContent.replace(replacerRegexp, '@import url(\'' + addCacheBuster(href) + '\')');
            parent.insertBefore(newNode, node);
            parent.removeChild(node);
        },
        processNextChangedHref = function () {
            var i,
                href;
            // Find the first non-busy href in changedHrefsQueue:
            for (i = 0 ; i < changedHrefsQueue.length ; i += 1) {
                if (isBusyByHref[changedHrefsQueue[i]]) {
                    if (liveStyleOptions.debug) {
                        log("Postponing 'change' notification on stylesheet that's already being refreshed: " + changedHrefsQueue[i]);
                    }
                } else {
                    href = changedHrefsQueue.splice(i, 1)[0];
                    break;
                }
            }
            if (!href) {
                return;
            }

            var cssIncludes = findCssIncludes(),
                newHref,
                replacerRegExp;

            if (href === location.pathname) {
                location.reload(true);
            }

            for (i = 0; i < cssIncludes.length; i += 1) {
                cssInclude = cssIncludes[i];
                var matchAgainstHref = removeCacheBuster(cssInclude.watchHref || cssInclude.href);

                if (matchAgainstHref === href) {
                    log('Refreshing ' + cssInclude.href);
                    if (cssInclude.type === 'link') {
                        // Less.js support (https://github.com/cloudhead/less.js)
                        if (/\bstylesheet\/less\b/i.test(cssInclude.node.getAttribute('rel')) && typeof less !== 'undefined') {
                            // Sadly this method isn't accessible
                            // less.loadStyleSheet(cssInclude.node, function () {}, false, 0);
                            // So instead we'll just have to brutally refresh ALL less includes
                            less.refresh();
                        } else {
                            replaceLinkTag(cssInclude.node, cssInclude.href, cssInclude.watchHref);
                        }
                    }

                    if (cssInclude.type === 'import') {
                        replaceStyleTag(cssInclude.styleElement, cssInclude.href, addCacheBuster(href));
                    }

                    if (cssInclude.type === 'prefixfree') {
                        // The next two lines are hacks to make Prefixfree think this is a link and not a style block
                        cssInclude.node.setAttribute('href', href); // No cache buster needed
                        cssInclude.node.rel = 'stylesheet';
                        StyleFix.link(cssInclude.node);
                    }

                    // Replacing the first occurrence should be good enough. Besides, the @import replacement code invalidates
                    // the rest of the cssIncludes in the same stylesheet.
                    break;
                }
            }
            processNextChangedHref(); // We consumed an item from changedHrefsQueue, keep going
        },
        startListening = function () {
            var socket = io.connect();

            socket.on('connect', function () {
                var hrefs = [],
                    watchNewStylesheets = function () {
                        var cssIncludes = findCssIncludes(),
                            toWatch = [],
                            href,
                            i;
                        //cssIncludes.unshift({ href: location.pathname }); // See https://github.com/One-com/livestyle/issues/11

                        for (i = 0; i < cssIncludes.length; i += 1) {
                            href = removeCacheBuster(cssIncludes[i].watchHref || cssIncludes[i].href);
                            if (hrefs.indexOf(href) === -1) {
                                hrefs.push(href);
                                toWatch.push(href);
                            }
                        }

                        if (toWatch.length !== 0) {
                            log('Subscribing to ' + toWatch.length + ' files:\n  ' + toWatch.join('\n  '));
                            socket.emit('watch', toWatch);
                        }
                    };

                watchNewStylesheets();
                setInterval(watchNewStylesheets, pollTimeout);
            }).on('change', function (href) {
                if (changedHrefsQueue.indexOf(href) === -1) {
                    changedHrefsQueue.push(href);
                    log('Received change notification for ' + href + ', queued');
                    processNextChangedHref();
                } else {
                    log('Received change notification for ' + href + ', skipped (already in queue)');
                }
            });
        },
        state = {},
        startPolling = function () {
            var getXHR = function () {
                    try {
                        return new XMLHttpRequest();
                    } catch (e1) {
                        try {
                            return new ActiveXObject("Msxml2.XMLHTTP.6.0");
                        } catch (e2) {
                            try {
                                return new ActiveXObject("Msxml2.XMLHTTP.3.0");
                            } catch (e3) {
                                try {
                                    return new ActiveXObject("Msxml2.XMLHTTP");
                                } catch (e4) {
                                    try {
                                        return new ActiveXObject("Microsoft.XMLHTTP");
                                    } catch (e5) {}
                                }
                            }
                        }
                    }

                    return null; // no XHR support
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
            //cssIncludes.unshift({ href: location.pathname }); // See https://github.com/One-com/livestyle/issues/11
            proceed();
        };

    if (typeof io !== 'undefined') {
        log('socket.io present, connecting');
        startListening();
    } else {
        log('socket.io not present, falling back to polling mode');
        startPolling();
    }
}());
