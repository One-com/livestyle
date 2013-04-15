var createLiveStyleApp = require('../lib/createLiveStyleApp');

module.exports = function createLiveStyleTestServer(options) {
    var app = createLiveStyleApp(options);

    // Listen on a vacant TCP port and hand back the url + app
    var server = app.listen(0);

    require('../lib/installLiveCssFileWatcherInServer')(server, options, require('socket.io'));

    var address = server.address();
    return {
        hostname: address.address,
        port: address.port,
        host: address.address + ':' + address.port,
        url: 'http://' + address.address + ':' + address.port,
        app: app
    };
};
