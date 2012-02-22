var fs = require('fs'),
    path = require('path');

module.exports = function (config) {
    var liveStyleClientCode = fs.readFileSync(path.resolve(__dirname, '../../livestyle-client.js'), 'utf-8')
        .replace(/liveStyleOptions\s*=\s*\{\}/, 'liveStyleOptions = ' + JSON.stringify(config));
    return function injectLiveStyleScriptIncludeIntoHtml(req, res, next) {
        var writeHead = res.writeHead;
        res.writeHead = function (statusCode, headers) {
            if (/^text\/html\b/.test((headers && headers['content-type']) || res.getHeader('content-type'))) {
                res.setHeader('cache-control', 'max-age=0, must-revalidate');
                res.removeHeader('content-length');
                if (headers) {
                    delete headers['content-length'];
                }
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
