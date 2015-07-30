/*global describe,it*/
var createLiveStyleTestServer = require('./createLiveStyleTestServer'),
    expect = require('unexpected'),
    fs = require('fs'),
    path = require('path'),
    ioClient = require('socket.io-client'),
    request = require('request');

describe('livestyle server in non-proxy mode', function () {
    // create a livestyle server in non-proxy mode, then request an HTML file
    // An HTML response with the LiveStyle client should be returned
    it('should return an HTML response with the livestyle client injected', function (done) {
        var appInfo = createLiveStyleTestServer({
            root: path.resolve(__dirname, 'nonProxy')
        });
        request('http://127.0.0.1:' + appInfo.port + '/', function (err, res, body) {
            expect(err, 'to be null');
            expect(res.statusCode, 'to be', 200);
            expect(res.headers['content-type'], 'to match', /^text\/html[; ]/);
            expect(body, 'to match', /<\/script><\/head>/);
            done();
        });
    });
    // create a livestyle server in non-proxy mode, subscribe to changes in styles.css, then overwrite it
    // the list of changed file names should only contain styles.css (and at least twice)
    it('should notify subscribers about changes in css', function (done) {
        function getRandomColor() {
            return '#' + (0x100000 + Math.floor(0xefffff * Math.random())).toString(16);
        }

        var appInfo = createLiveStyleTestServer({root: path.resolve(__dirname, 'nonProxy')}),
            cssFileName = path.resolve(__dirname, 'nonProxy/style sheet.css'),
            changedFileNames = [];

        var socket = ioClient.connect('http://localhost:' + appInfo.port);

        socket.on('connect', function () {
            socket.emit('watch', ['/style%20sheet.css']);
            socket.on('change', function (fileName) {
                changedFileNames.push(fileName);
            });

            // Wait a little, then overwrite the watched file twice:
            setTimeout(function () {
                fs.writeFile(cssFileName, 'body {\n    background-color: ' + getRandomColor() + ';\n}\n', 'utf-8', function () {
                    fs.writeFile(cssFileName, 'body {\n    background-color: red;\n}\n', 'utf-8', function () {
                        expect(changedFileNames.length, 'to be greater than', 2);
                        expect(changedFileNames, 'to be an array whose items satisfy', function (item) {
                            expect(item, 'to be', '/style%20sheet.css');
                        });
                        done();
                    });
                });
            }, 100);
        });
    });
    // create a livestyle server in non-proxy mode with a mapping from
    // /fo%20o/ to /ba%20r/, then request /fo%20o/hello.txt
    // The contents of /bar/hello.txt should be returned
    it('mapping from /fo%20/ to /ba%20r/', function (done) {
        var appInfo = createLiveStyleTestServer({
                root: path.resolve(__dirname, 'nonProxy'),
                mappings: {
                    '/fo%20o/': '/ba%20r/'
                }
            });

        request('http://127.0.0.1:' + appInfo.port + '/fo%20o/hello.txt', function (err, res, body) {
            expect(err, 'to be null');
            expect(res.statusCode, 'to be', 200);
            expect(body, 'to be', 'The contents of /ba r/hello.txt\n');
            done();
        });
    });
    // create a livestyle server in non-proxy mode, request a less file, and autoprefix stuff in it
    // A CSS response with prefixes should be returned
    it('request a less file and autoprefix stuff in that', function (done) {
        var appInfo = createLiveStyleTestServer({
            root: path.resolve(__dirname, 'compilessAutoprefixer'),
            autoprefixer: { browsers: ['last 2 versions', 'ie > 8'], cascade: false },
            compiless: true
        });

        request('http://127.0.0.1:' + appInfo.port + '/test.less', function (err, res, body) {
            expect(err, 'to be null');
            expect(res.statusCode, 'to be', 200);
            expect(res.headers['content-type'], 'to be', 'text/css');
            expect(body, 'to be', [
                '.nonNested {',
                '  -webkit-animation-name: test;',
                '  animation-name: test;',
                '}',
                '.nested .deep {',
                '  -webkit-animation-name: test;',
                '  animation-name: test;',
                '}',
                ''
            ].join('\n'));
            done();
        });
    });

    // create a livestyle server in non-proxy mode, request a sass file
    // A CSS response should be returned
    it('should compile a scss file to css', function (done) {
        var appInfo = createLiveStyleTestServer({
            root: path.resolve(__dirname, 'middlewares'),
            compilesass: true
        });

        request('http://127.0.0.1:' + appInfo.port + '/main.scss', function (err, res, body) {
            expect(err, 'to be null');
            expect(res.statusCode, 'to be', 200);
            expect(res.headers['content-type'], 'to contain', 'text/css');
            expect(body, 'to contain', [
                '.scss {',
                '  background: blue;',
                '  transform: translateZ(2); }',
                '',
            ].join('\n'));
            done();
        });
    });

    // create a livestyle server in non-proxy mode, request a sass file and autoprefix the result
    // A CSS response with prefixes should be returned
    it('should compile a scss file to css and autoprefix the response', function (done) {
        var appInfo = createLiveStyleTestServer({
            root: path.resolve(__dirname, 'middlewares'),
            autoprefixer: { browsers: ['last 30 versions'], cascade: false },
            compilesass: true
        });

        request('http://127.0.0.1:' + appInfo.port + '/main.scss', function (err, res, body) {
            expect(err, 'to be null');
            expect(res.statusCode, 'to be', 200);
            expect(res.headers['content-type'], 'to contain', 'text/css');
            expect(body, 'to contain', [
                '.scss {',
                '  background: blue;',
                '  -webkit-transform: translateZ(2);',
                '  -moz-transform: translateZ(2);',
                '  transform: translateZ(2); }',
                '',
            ].join('\n'));
            done();
        });
    });

    it('should serve html correctly with sass compiler active', function (done) {
        var appInfo = createLiveStyleTestServer({
            root: path.resolve(__dirname, 'middlewares'),
            compilesass: true
        });

        request('http://127.0.0.1:' + appInfo.port + '/index.html', function (err, res, body) {
            expect(err, 'to be null');
            expect(res.statusCode, 'to be', 200);
            expect(res.headers['content-type'], 'to contain', 'text/html');
            expect(body, 'to contain', '<!DOCTYPE html>');
            done();
        });
    });

    it('should serve html correctly with autoprefixer active', function (done) {
        var appInfo = createLiveStyleTestServer({
            root: path.resolve(__dirname, 'middlewares'),
            autoprefixer: { browsers: ['last 30 versions'], cascade: false },
        });

        request('http://127.0.0.1:' + appInfo.port + '/index.html', function (err, res, body) {
            expect(err, 'to be null');
            expect(res.statusCode, 'to be', 200);
            expect(res.headers['content-type'], 'to contain', 'text/html');
            expect(body, 'to contain', '<!DOCTYPE html>');
            done();
        });
    });

    it('should not throw when serving html through autoprefixer and injectLiveStyleScriptIncludeIntoHtml', function (done) {
        var express = require('express');
        var injector = require('../lib/middleware/injectLiveStyleScriptIncludeIntoHtml');
        var autoprefixer = require('express-autoprefixer');
        var root = path.resolve(__dirname, 'middlewares');

        var app = express();

        app.use(injector());
        app.use(autoprefixer({ browsers: ['last 30 versions'], cascade: false }));
        app.use(express['static'](root));

        var server = app.listen(0);
        var info = server.address();

        request('http://127.0.0.1:' + info.port + '/index.html', function (err, res, body) {
            expect(err, 'to be null');
            expect(res.statusCode, 'to be', 200);
            expect(res.headers['content-type'], 'to contain', 'text/html');
            expect(body, 'to contain', '<!DOCTYPE html>');
            done();
        });
    });
});
