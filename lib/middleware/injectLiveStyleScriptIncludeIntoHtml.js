var fs = require('fs'),
    path = require('path'),
    liveStyleClientCode = fs.readFileSync(path.resolve(__dirname, '../../livestyle-client.js'), 'utf-8');

module.exports = function () {
    return function injectLiveStyleScriptIncludeIntoHtml(req, res, next) {
        var writeHead = res.writeHead;
        res.writeHead = function (statusCode, headers) {
            if (/^text\/html\b/.test(res.getHeader('content-type'))) {
                res.removeHeader('content-length');
                var end = res.end;
                res.end = function (chunk, encoding) {
                    if (typeof chunk !== 'undefined') {
                        res.write(chunk, encoding);
                    }
                    res.write('<script src="/socket.io/socket.io.js"></script>' +
                              '<script>' + liveStyleClientCode + '</script>');
                    end.call(this);
                };
            }
            writeHead.apply(this, arguments);
        };
        next();
    };
};
