var URL = require('url'),
    express = require('express'),
    request = require('request'),
    compiless = require('express-compiless'),
    processImage = require('express-processimage');

module.exports = function createLiveStyleApp(options) {
    var app = express(),
        proxyUrl;

    if (options.proxy) {
        if (!/\/$/.test(options.proxy)) {
            options.proxy += '/';
        }
        proxyUrl = URL.parse(options.proxy);
    }

    app.configure(function () {
        if (options.debug) {
            app.use(express.logger('dev'));
        }

        app
            .use(require('./middleware/bufferDataEventsUntilFirstListener')())
            .use(require('./middleware/injectLiveStyleScriptIncludeIntoHtml')(options));

        if (options.mappings) {
            app
                .use(function (req, res, next) {
                    Object.keys(options.mappings).forEach(function (url) {
                        if (req.url.indexOf(url) === 0) {
                            req.url = req.url.replace(url, options.mappings[url]);
                        }
                    });
                    next();
                });
        }

        if (options.processImage) {
            app.use(processImage());
        }

        if (options.root) {
            if (options.compiless) {
                app.use(compiless({root: options.root}));
            }

            var staticProvider = express['static'](options.root);
            app.use(function (req, res, next) {
                if (!proxyUrl || req.accepts('css') || req.accepts('text/x-less')) {
                    staticProvider(req, res, next);
                } else {
                    next();
                }
            });
        }

        if (proxyUrl) {
            var selfRedirectUrlRegExp = new RegExp('^' + proxyUrl.protocol + '//' + proxyUrl.host.replace(/[\.\+\*\?\{\}\[\]\(\)]/g, '\\$&') + '/');
            app.use(function (req, res, next) {
                var targetUrl = proxyUrl.protocol + '//' + proxyUrl.host + req.url,
                    upstreamRequest = request({
                        followRedirect: false,
                        method: req.method,
                        url: targetUrl,
                        onResponse: true
                    }, function (err, response) {
                        if (options.debug) {
                            console.warn('Proxying ' + req.url + ' to ' + targetUrl + ' => ' + (err ? err.toString() : response.statusCode));
                        }
                        if (err) {
                            res.writeHead(502, {});
                            res.end('Error connecting to upstream server: ' + err.stack);
                        } else {
                            if (response.headers.location && /^https?:/.test(response.headers.location)) {
                                // HTTP redirect. If it's an absolute url pointing at the upstream server, rewrite it to a relative one
                                // so it points at the LiveStyle proxy. Technically this is a violation of the HTTP spec, but getting the
                                // LiveStyle server's host/port is a bit hard from here, and browsers understand it fine:
                                var rewrittenRedirect = response.headers.location.replace(selfRedirectUrlRegExp, '/');
                                if (rewrittenRedirect !== response.headers.location) {
                                    if (options.debug) {
                                        console.warn("Rewriting redirect from upstream server: " + response.headers.location + " => " + rewrittenRedirect);
                                    }
                                    response.headers.location = rewrittenRedirect;
                                }
                            }
                            res.writeHead(response.statusCode, response.headers);
                            response.pipe(res);
                        }
                    });
                req.pipe(upstreamRequest);
            });
        }

        app.use(express.errorHandler({dumpExceptions: options.debug, showStack: options.debug}));
    });

    return app;
};
