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

vows.describe('foo').addBatch({
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
                    socket.emit('watch', ['styles.css'], '/');
                    socket.on('change', function (fileName) {
                        changedFileNames.push(fileName);
                    });

                    // Wait a second, then overwrite the watched file:
                    setTimeout(function () {
                        fs.writeFileSync(cssFileName, 'body {\n    background-color: ' + getRandomColor() + ';\n}\n', 'utf-8');

                        // Wait another second, then report the changed files to the callback:
                        setTimeout(function () {
                            callback(null, changedFileNames);

                            // Poor man's teardown: Reset the file to its original contents:
                            fs.writeFileSync(cssFileName, 'body {\n    background-color: red;\n}\n', 'utf-8');
                        }, 1000);
                    }, 1000);
                });
            }, 2000);
        },
        'styles.css should be in the list of changed file names': function (changedFileNames) {
            assert.deepEqual(changedFileNames, ['styles.css']);
        }
    }
})['export'](module);
