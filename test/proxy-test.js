var createLiveStyleTestServer = require('./createLiveStyleTestServer'),
    expect = require('unexpected'),
    fs = require('fs'),
    path = require('path'),
    express = require('express'),
    ioClient = require('socket.io-client'),
    request = require('request');

describe('livestyle server in proxy mode', function () {
    // create a livestyle server in pure proxy mode and an upstream
    // server, then request an HTML file
    // the HTML file should be patched with the bootstrapper right
    // before </head>
    it('should inject the livestyle client in a document', function (done) {
        var root = path.resolve(__dirname, 'proxy'),
            upstreamApp = express().use(express['static'](root)),
            upstreamServer = upstreamApp.listen(0),
            upstreamServerUrl = 'http://127.0.0.1:' + upstreamServer.address().port + '/',
            appInfo = createLiveStyleTestServer({
                proxy: upstreamServerUrl
            });

        request({method: 'GET', url: 'http://127.0.0.1:' + appInfo.port + '/'}, function (err, res, body) {
            expect(err, 'to be null');
            expect(body, 'to match', /<\/script><\/head>/);
            done();
        });
    });
    // create a livestyle server in pure proxy mode and an upstream
    // server, then request an HTML file
    // the HTML file should be patched with the bootstrapper right
    // before </script>
    it('should inject the livestyle client in a document before first script tag', function (done) {
        var root = path.resolve(__dirname, 'proxy'),
            upstreamApp = express().use(express['static'](root)),
            upstreamServer = upstreamApp.listen(0),
            upstreamServerUrl = 'http://127.0.0.1:' + upstreamServer.address().port + '/',
            appInfo = createLiveStyleTestServer({
                proxy: upstreamServerUrl
            });

        request({method: 'GET', url: 'http://127.0.0.1:' + appInfo.port + '/earlyscript.html'}, function (err, res, body) {
            expect(err, 'to be null');
            expect(body, 'to match', /<\/script><script id="earlyscript">/);
            done();
        });
    });
    // create a livestyle server in pure proxy mode and an upstream
    // server, then request an HTML file with no </head>
    // the HTML file should be patched with the bootstrapper right
    // before </html>
    it('inject the client into a headless file', function (done) {
        var root = path.resolve(__dirname, 'proxy'),
            upstreamApp = express().use(express['static'](root)),
            upstreamServer = upstreamApp.listen(0),
            upstreamServerUrl = 'http://127.0.0.1:' + upstreamServer.address().port + '/',
            appInfo = createLiveStyleTestServer({
                proxy: upstreamServerUrl
            });

        request({
            method: 'GET',
            url: 'http://127.0.0.1:' + appInfo.port + '/nohead.html'
        }, function (err, res, body) {
            expect(err, 'to be null');
            expect(body, 'to match', /<\/script><\/html>/);
            done();
        });
    });
    // create a livestyle server in pure proxy mode and an upstream
    // server, then request an HTML file with no </head> and no
    // </html>
    // the HTML file should be patched with the bootstrapper at the
    // end
    it('inject the client into increasingly bad html', function (done) {
        var root = path.resolve(__dirname, 'proxy'),
            upstreamApp = express().use(express['static'](root)),
            upstreamServer = upstreamApp.listen(0),
            upstreamServerUrl = 'http://127.0.0.1:' + upstreamServer.address().port + '/',
            appInfo = createLiveStyleTestServer({
                proxy: upstreamServerUrl
            });

        request({
            method: 'GET',
            url: 'http://127.0.0.1:' + appInfo.port + '/noheadnoendhtml.html'
        }, function (err, res, body) {
            expect(err, 'to be null');
            expect(body, 'to match', /<\/script>$/);
            done();
        });
    });
    // create a livestyle server in pure proxy mode and an upstream
    // server that redirects /subdir to /subdir/, then request a
    // directory
    // the response should be an 301 pointing at /subdir/ on the
    // LiveStyle server
    it('proxy redirects correctly', function (done) {
        var root = path.resolve(__dirname, 'proxy'),
            upstreamServerUrl,
            upstreamApp = express()
                .use(function (req, res, next) {
                    if (req.url === '/subdir') {
                        res.writeHead(301, {
                            location: upstreamServerUrl + 'subdir/'
                        });
                        res.end('The upstream server at ' + upstreamServerUrl + ' says redirect!');
                    } else {
                        res.send(400);
                    }
                }),
        upstreamServer = upstreamApp.listen(0);

        upstreamServerUrl = 'http://127.0.0.1:' + upstreamServer.address().port + '/';

        var appInfo = createLiveStyleTestServer({proxy: upstreamServerUrl});

        request({
            method: 'GET',
            followRedirect: false,
            url: 'http://127.0.0.1:' + appInfo.port + '/subdir'
        }, function (err, res, body) {
            expect(err, 'to be null');
            expect(res.statusCode, 'to be', 301);
            // Accept both and absolute and a relative Location header:
            expect(
                res.headers.location,
                'to match',
                /^(?:http:\/\/127\.0\.0\.1:' + appInfo.port + ')?\/subdir\//
            );
            done();
        });
    });
    // create a livestyle server with a mapping from /fo%20o/ to
    // /ba%20r/ along with an upstream server, then request
    // /fo%20o/hello.txt
    // the contents of /ba r/hello.txt should be served
    it('proxy mappings', function (done) {
        var root = path.resolve(__dirname, 'proxy'),
            upstreamApp = express().use(express['static'](root)),
            upstreamServer = upstreamApp.listen(0),
            upstreamServerUrl = 'http://127.0.0.1:' + upstreamServer.address().port + '/',
            appInfo = createLiveStyleTestServer({
                proxy: upstreamServerUrl,
                mappings: {
                    '/fo%20o/': '/ba%20r/'
                }
            });

        request('http://127.0.0.1:' + appInfo.port + '/fo%20o/hello.txt', function (err, res, body) {
            expect(err, 'to be null');
            expect(body, 'to be', 'The contents of /ba r/hello.txt\n');
            done();
        });
    });
});
