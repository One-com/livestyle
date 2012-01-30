var fs = require('fs'),
    vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    express = require('express'),
    request = require('request'),
    ioClient = require('socket.io-client'),
    createLiveStyleTestServer = require('./createLiveStyleTestServer');

function getRandomColor() {
    return '#' + (0x100000 + Math.floor(0xefffff * Math.random())).toString(16);
}

vows.describe('foo').addBatch({
    'create a livestyle server in pure proxy mode and an upstream server, then request an HTML file': {
        topic: function () {
            var callback = this.callback,
                documentRoot = path.resolve(__dirname, 'proxy'),
                upstreamServer = express.createServer()
                    .use(express['static'](documentRoot));

            upstreamServer.listen(0);

            var upstreamServerUrl = 'http://127.0.0.1:' + upstreamServer.address().port + '/',
                appInfo = createLiveStyleTestServer({
                    proxy: upstreamServerUrl
                });

            // Wait a couple of seconds for the servers to become available
            setTimeout(function () {
                request({method: 'GET', url: 'http://127.0.0.1:' + appInfo.port + '/'}, callback);
            }, 2000);
        },
        'the HTML file should be patched with the bootstrapper': function (err, response, body) {
            assert.isNull(err);
            assert.matches(body, /socket\.io/);
        }
    }
})['export'](module);
