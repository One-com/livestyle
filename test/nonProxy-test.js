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
    'create a livestyle server in non-proxy mode, subscribe to changes in styles.css, then overwrite it': {
        topic: function () {
            var callback = this.callback,
                appInfo = createLiveStyleTestServer({documentRoot: path.resolve(__dirname, 'nonProxy')}),
                cssFileName = path.resolve(__dirname, 'nonProxy/styles.css'),
                changedFileNames = [];

            // Wait a couple of seconds for the server to become available, then connect to it:
            setTimeout(function () {
                var socket = ioClient.connect('http://localhost:' + appInfo.port);

                socket.on('connect', function () {
                    socket.emit('watch', ['/styles.css']);
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
        'the list of changed file names should contain styles.css twice': function (changedFileNames) {
            assert.deepEqual(changedFileNames, ['/styles.css', '/styles.css']);
        }
    },
    'create a livestyle server in non-proxy mode with a mapping from /foo/ to /bar/, then request /foo/hello.txt': {
        topic: function () {
            var callback = this.callback,
                appInfo = createLiveStyleTestServer({
                    documentRoot: path.resolve(__dirname, 'nonProxy'),
                    mappings: {
                        '/foo/': '/bar/'
                    }
                });

            // Wait a couple of seconds for the server to become available
            setTimeout(function () {
                request('http://127.0.0.1:' + appInfo.port + '/foo/hello.txt', callback);
            }, 2000);
        },
        'The contents of /bar/hello.txt should be returned': function (err, response, body) {
            assert.isNull(err);
            assert.equal(response.statusCode, 200);
            assert.equal(body, 'The contents of /bar/hello.txt\n');
        }
    }
})['export'](module);
