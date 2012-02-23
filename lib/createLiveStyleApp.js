var URL = require('url'),
    express = require('express'),
    request = require('request');

module.exports = function createLiveStyleApp(options) {
    var app = express.createServer(),
        proxyUrl;

    if (options.proxy) {
        if (!/\/$/.test(options.proxy)) {
            options.proxy += '/';
        }
        proxyUrl = URL.parse(options.proxy);
    }

    app.configure(function () {
        if (options.debug) {
            app.use(express.logger());
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

        if (options.documentRoot) {
            var staticProvider = express['static'](options.documentRoot);
            app.use(function (req, res, next) {
                if (!proxyUrl || req.accepts('css') || req.accepts('text/x-less')) {
                    staticProvider(req, res, next);
                } else {
                    next();
                }
            });
        }

        if (proxyUrl) {
            app.use(function (req, res, next) {
                var targetUrl = proxyUrl.protocol + '//' + proxyUrl.host + req.url,
                    upstreamRequest = request({
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
                            res.writeHead(response.statusCode, response.headers);
                            response.pipe(res);
                        }
                    });
                req.pipe(upstreamRequest);
            });
        }

        if (options.documentRoot) {
            require('../lib/installLiveCssFileWatcherInServer')(app, {
                debug: options.debug,
                documentRoot: options.documentRoot,
                mappings: options.mappings
            }, require('socket.io'));
        }

        app.use(express.errorHandler({dumpExceptions: options.debug, showStack: options.debug}));
    });

    return app;
};
