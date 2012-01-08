var URL = require('url'),
    express = require('express'),
    request = require('request');

module.exports = function createApp(options) {
    var app = express.createServer(),
        proxyUrl = options.proxy && URL.parse(options.proxy);

    app.configure(function () {
        app
            .use(express.logger())
            .use(require('../lib/middleware/injectLiveStyleScriptIncludeIntoHtml')());

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
                request({
                    method: req.method,
                    url: proxyUrl.protocol + '//' + proxyUrl.host + req.url,
                    onResponse: true
                }, function (err, response) {
                    res.writeHead(response.statusCode, response.headers);
                    response.pipe(res);
                });
            });
        }

        app.use(express.errorHandler({dumpExceptions: true, showStack: true}));

        require('../lib/installLiveCssFileWatcherInServer')(app, {
            documentRoot: options.documentRoot,
            mappings: options.mappings
        }, require('socket.io'));
    });

    return app;
};
