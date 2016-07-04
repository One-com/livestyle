var URL = require('url'),
    express = require('express'),
    request = require('request'),
    logger = require('morgan'),
    errorHandler = require('errorhandler'),
    compiless,
    compilesass,
    jsxtransform,
    autoprefixer,
    processImage;

module.exports = function createLiveStyleApp(options) {
    var app = express(),
        proxyUrl;

    if (options.debug) {
        console.warn('Staring with configuration:', JSON.stringify(options, undefined, 2));
    }

    if (options.proxy) {
        if (!/\/$/.test(options.proxy)) {
            options.proxy += '/';
        }
        proxyUrl = URL.parse(options.proxy);
    }

    if (options.debug) {
        app.use(logger('dev'));
    }

    app.use(require('./middleware/bufferDataEventsUntilFirstListener')());

    if (!options.dead) {
        app.use(require('./middleware/injectLiveStyleScriptIncludeIntoHtml')(options));
    }

    if (options.mappings) {
        app.use(function (req, res, next) {
                Object.keys(options.mappings).forEach(function (url) {
                    if (req.url.indexOf(url) === 0) {
                        var before = req.url;

                        req.url = before.replace(url, options.mappings[url]);

                        if (options.debug) {
                            console.warn('Mapping: ' + before + ' => ' + req.url);
                        }
                    }
                });
                next();
            });
    }

    if (options.processImage) {
        processImage = require('express-processimage');

        app.use(processImage({root: options.root}));
    }

    if (options.autoprefixer) {
      autoprefixer = require('express-autoprefixer')
        var autoprefixerOptions = {};
        if (typeof options.autoprefixer === 'string' || Array.isArray(options.autoprefixer)) {
            autoprefixerOptions = { browsers: options.autoprefixer };
        } else if (typeof options.autoprefixer === 'object') {
            autoprefixerOptions = options.autoprefixer;
        }
        app.use(autoprefixer(autoprefixerOptions));
    }

    if (options.root) {
        if (options.compiless) {
            compiless = require('express-compiless');

            app.use(compiless({root: options.root}));
        }

        if (options.compilesass) {
            compilesass = require('express-compile-sass');

            app.use(compilesass({
                root: options.root,
                sourceMap: true,
                watchFiles: !options.dead,
                logToConsole: options.debug
            }));
        }

        if (options.jsxtransform) {
            jsxtransform = require('express-jsxtransform');

            app.use(jsxtransform());
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
        app.use(function (req, res) {
            // Pass on the host header so servers further down the line can use it
            req.headers.Host = proxyUrl.host;

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
                                    console.warn('Rewriting redirect from upstream server: ' + response.headers.location + ' => ' + rewrittenRedirect);
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

    app.use(errorHandler);

    return app;
};
