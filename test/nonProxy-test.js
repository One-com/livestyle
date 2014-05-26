var fs = require('fs'),
    vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    request = require('request'),
    ioClient = require('socket.io-client'),
    createLiveStyleTestServer = require('./createLiveStyleTestServer');

function getRandomColor() {
    return '#' + (0x100000 + Math.floor(0xefffff * Math.random())).toString(16);
}

vows.describe('livestyle server in non-proxy mode').addBatch({
    'create a livestyle server in non-proxy mode, then request an HTML file': {
        topic: function () {
            var callback = this.callback,
                appInfo = createLiveStyleTestServer({root: path.resolve(__dirname, 'nonProxy')});

            // Wait a couple of seconds for the server to become available
            setTimeout(function () {
                request('http://127.0.0.1:' + appInfo.port + '/', callback);
            }, 2000);
        },
        'An HTML response with the LiveStyle client should be returned': function (err, response, body) {
            assert.isNull(err);
            assert.equal(response.statusCode, 200);
            assert.matches(response.headers['content-type'], /^text\/html[; ]/);
            assert.matches(body, /<\/script><\/head>/);
        }
    },
    'create a livestyle server in non-proxy mode, subscribe to changes in styles.css, then overwrite it': {
        topic: function () {
            var callback = this.callback,
                appInfo = createLiveStyleTestServer({root: path.resolve(__dirname, 'nonProxy')}),
                cssFileName = path.resolve(__dirname, 'nonProxy/style sheet.css'),
                changedFileNames = [];

            // Wait a couple of seconds for the server to become available, then connect to it:
            setTimeout(function () {
                var socket = ioClient.connect('http://localhost:' + appInfo.port);

                socket.on('connect', function () {
                    socket.emit('watch', ['/style%20sheet.css']);
                    socket.on('change', function (fileName) {
                        changedFileNames.push(fileName);
                    });

                    // Wait a second, then overwrite the watched file:
                    setTimeout(function () {
                        fs.writeFileSync(cssFileName, 'body {\n    background-color: ' + getRandomColor() + ';\n}\n', 'utf-8');

                        // Wait another second, then reset the file to its original contents:
                        setTimeout(function () {
                            fs.writeFile(cssFileName, 'body {\n    background-color: red;\n}\n', 'utf-8', function () {
                                // Wait another second and report back to the callback:
                                setTimeout(function () {
                                    callback(null, changedFileNames);
                                }, 1000);
                            });
                        }, 1000);
                    }, 1000);
                });
            }, 2000);
        },
        'the list of changed file names should only contain styles.css (and at least twice)': function (changedFileNames) {
            assert.greater(changedFileNames.length, 1);
            assert.ok(changedFileNames.every(function (fileName) {return fileName === '/style%20sheet.css';}));
        }
    },
    'create a livestyle server in non-proxy mode with a mapping from /fo%20o/ to /ba%20r/, then request /fo%20o/hello.txt': {
        topic: function () {
            var callback = this.callback,
                appInfo = createLiveStyleTestServer({
                    root: path.resolve(__dirname, 'nonProxy'),
                    mappings: {
                        '/fo%20o/': '/ba%20r/'
                    }
                });

            // Wait a couple of seconds for the server to become available
            setTimeout(function () {
                request('http://127.0.0.1:' + appInfo.port + '/fo%20o/hello.txt', callback);
            }, 2000);
        },
        'The contents of /bar/hello.txt should be returned': function (err, response, body) {
            assert.isNull(err);
            assert.equal(response.statusCode, 200);
            assert.equal(body, 'The contents of /ba r/hello.txt\n');
        }
    },
    'create a livestyle server in non-proxy mode, request a less file, and autoprefix stuff in it': {
        topic: function () {
            var callback = this.callback,
                appInfo = createLiveStyleTestServer({
                    root: path.resolve(__dirname, 'compilessAutoprefixer'),
                    autoprefixer: 'last 2 versions, ie > 8',
                    compiless: true
                });

            // Wait a couple of seconds for the server to become available
            setTimeout(function () {
                request('http://127.0.0.1:' + appInfo.port + '/test.less', callback);
            }, 2000);
        },
        'A CSS response with prefixes should be returned': function (err, response, body) {
            assert.isNull(err);
            assert.equal(response.statusCode, 200);
            assert.equal(response.headers['content-type'], 'text/css');
            assert.equal(body, [
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
        }
    }
})['export'](module);
