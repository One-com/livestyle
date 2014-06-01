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

        var callback = function (changedFileNames) {
                expect(changedFileNames.length, 'to be greater than', 2);
                expect(changedFileNames, 'to be an array whose items satisfy', function (item) {
                    expect(item, 'to be', '/style%20sheet.css');
                });
                done();
            },
            appInfo = createLiveStyleTestServer({root: path.resolve(__dirname, 'nonProxy')}),
            cssFileName = path.resolve(__dirname, 'nonProxy/style sheet.css'),
            changedFileNames = [];

        var socket = ioClient.connect('http://localhost:' + appInfo.port);

        socket.on('connect', function () {
            socket.emit('watch', ['/style%20sheet.css']);
            socket.on('change', function (fileName) {
                changedFileNames.push(fileName);
            });

            // Wait a little, then overwrite the watched file:
            setTimeout(function () {
                fs.writeFileSync(cssFileName, 'body {\n    background-color: ' + getRandomColor() + ';\n}\n', 'utf-8');

                // Wait a little, then reset the file to its original contents:
                setTimeout(function () {
                    fs.writeFile(cssFileName, 'body {\n    background-color: red;\n}\n', 'utf-8', function () {
                        // Wait a little and report back to the callback:
                        setTimeout(function () {
                            callback(changedFileNames);
                        }, 10);
                    });
                }, 10);
            }, 10);
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
        var callback = this.callback,
        appInfo = createLiveStyleTestServer({
            root: path.resolve(__dirname, 'compilessAutoprefixer'),
            autoprefixer: 'last 2 versions, ie > 8',
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
});
