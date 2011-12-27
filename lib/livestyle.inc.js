/*global document, location, io*/
(function () {
    'use strict';

    var socketIoScriptElement,
        isLocal = function (href) {
            var local = new RegExp("^" + document.location.protocol + "//" + document.location.host.replace(/[\.]/g, '\\$0')),
                remote = /:\/\/|^\/\//;

            return local.test(href) || !remote.test(href);
        },
        startListening = function () {
            var findCssIncludes = function () {
                    var cssIncludes = [],
                        links = document.getElementsByTagName('link'),
                        styleSheet,
                        cssRule,
                        i,
                        j,
                        href;

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
                socket = io.connect();

            socket.on('connect', function () {
                var cssIncludes = findCssIncludes(),
                    hrefs = [],
                    i;

                for (i = 0; i < cssIncludes.length; i += 1) {
                    hrefs.push(cssIncludes[i].href);
                }

                socket.emit('watch', hrefs, location.href);
            }).on('change', function (href) {
                var cssIncludes = findCssIncludes(),
                    i,
                    cssInclude,
                    cssIncludeHrefWithoutBuster,
                    newHref,
                    replacerRegExp;

                for (i = 0; i < cssIncludes.length; i += 1) {
                    cssInclude = cssIncludes[i];
                    cssIncludeHrefWithoutBuster = cssInclude.href.replace(/[?&]livecssbuster=\d+/, '');

                    if (cssIncludeHrefWithoutBuster === href) {
                        newHref = cssIncludeHrefWithoutBuster + (cssIncludeHrefWithoutBuster.indexOf('?') === -1 ? '?' : '&') + 'livecssbuster=' + new Date().getTime();
                        if (cssInclude.type === 'import') {
                            replacerRegExp = new RegExp("@import\\s+url\\(" + cssInclude.href.replace(/[\?\[\]\(\)\{\}]/g, "\\$&") + "\\)");
                            cssInclude.styleElement.innerHTML = cssInclude.styleElement.innerHTML.replace(replacerRegExp, '@import url(' + newHref + ')');
                        } else {
                            cssInclude.node.setAttribute('href', newHref);
                        }
                        // Replacing the first occurrence should be good enough. Besides, the @import replacement code invalidates
                        // the rest of the cssIncludes in the same stylesheet.
                        break;
                    }
                }
            });
        };

    if (typeof io === 'undefined') {
        socketIoScriptElement = document.createElement('script');
        socketIoScriptElement.onload = startListening;
        socketIoScriptElement.setAttribute('src', '/socket.io/socket.io.js'); // Local
        //socketIoScriptElement.setAttribute('src', 'http://cdn.socket.io/stable/socket.io.js'); // CDN
        document.getElementsByTagName('head')[0].appendChild(socketIoScriptElement);
    } else {
        startListening();
    }
}());
