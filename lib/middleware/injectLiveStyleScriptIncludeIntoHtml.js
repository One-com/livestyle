var fs = require('fs'),
    path = require('path');

require('bufferjs');

function hijackAndBufferResponseIfHtml(req, res, next, cb) {
    var write = res.write,
        end = res.end,
        writeHead = res.writeHead,
        writeHeadArguments,
        encoding,
        chunks;

    res.write = function (chunk, encoding) {
        if (!this.headerSent) this._implicitHeader();
        if (chunks) {
            chunks.push(chunk);
        } else {
            write.call(res, chunk, encoding);
        }
    };

    res.end = function (chunk, encoding) {
        if (chunks) {
            res.write = write;
            res.end = end;
            res.writeHead = writeHead;
            var buffer = Buffer.concat(chunks);
            chunks = null;
            cb(null, writeHeadArguments, buffer, encoding);
        } else {
            if (chunk) this.write(chunk, encoding);
            end.call(res);
        }
    };

    var writeHeadCalled = false;
    res.writeHead = function (statusCode, headers) { // ...
        if (writeHeadCalled) {
            return;
        }
        writeHeadCalled = true;
        var contentType = (headers && headers['content-type']) || res.getHeader('content-type'),
            matchContentType = contentType && contentType.match(/^text\/html(?:;\s*charset=('|"|)([^'"]+)\1)?$/i);

        if (req.method === 'HEAD') return;

        if (matchContentType) {
            res.removeHeader('Content-Length');
            chunks = [];
            encoding = matchContentType[2];
            writeHeadArguments = arguments;
        } else {
            writeHead.apply(res, arguments);
        }
    };
    next();
}

module.exports = function (config) {
    var liveStyleClientCode = fs.readFileSync(path.resolve(__dirname, '../../livestyle-client.js'), 'utf-8')
        .replace(/liveStyleOptions\s*=\s*\{\}/, 'liveStyleOptions = ' + JSON.stringify(config));
    return function injectLiveStyleScriptIncludeIntoHtml(req, res, next) {
        if (req.accepts('html') || (req.headers.accept && req.headers.accept.indexOf('*/*') !== -1)) {
            delete req.headers['if-none-match'];
            delete req.headers['if-modified-since'];
            delete req.headers['content-length'];

            hijackAndBufferResponseIfHtml(req, res, next, function (err, writeHeadArguments, body, encoding) {
                res.removeHeader('content-length');
                res.removeHeader('etag');
                res.removeHeader('last-modified');
                if (writeHeadArguments) {
                    if (writeHeadArguments[1] && typeof writeHeadArguments[1] === 'object') {
                        delete writeHeadArguments[1]['Content-Length'];
                        delete writeHeadArguments[1]['content-length'];
                        delete writeHeadArguments[1]['ETag'];
                        delete writeHeadArguments[1]['last-modified'];
                        delete writeHeadArguments[1]['Last-Modified'];
                    }
                    res.writeHead.apply(res, writeHeadArguments);
                }

                function injectScriptAtIndex(i) {
                    if (i > 0) {
                        res.write(body.slice(0, i));
                    }
                    res.write('<script src="/socket.io/socket.io.js"></script>' +
                              '<script>' + liveStyleClientCode + '</script>');
                    if (body.length > i) {
                        res.write(body.slice(i));
                    }
                    res.end();
                }

                var state = 0;
                for (var i = 0 ; i < body.length ; i += 1) {
                    var ch;
                    if (Buffer.isBuffer(body)) {
                        ch = String.fromCharCode(body[i]);
                    } else {
                        // string
                        ch = body[i];
                    }
                    switch (state) {
                    case 0:
                        if (ch === '<') {
                            state = 1;
                        }
                        break;
                    case 1: // <
                        if (ch === '/') {
                            state = 2;
                        } else {
                            state = 0;
                        }
                        break;
                    case 2: // </
                        if (ch === 'h' || ch === 'H') {
                            state = 3;
                        } else {
                            state = 0;
                        }
                        break;
                    case 3: // </h
                        if (ch === 'e' || ch === 'E') {
                            state = 4;
                        } else if (ch === 't' || ch === 'T') {
                            state = 7;
                        } else {
                            state = 0;
                        }
                        break;
                    case 4: // </he
                        if (ch === 'a' || ch === 'A') {
                            state = 5;
                        } else {
                            state = 0;
                        }
                        break;
                    case 5: // </hea
                        if (ch === 'd' || ch === 'D') {
                            state = 6;
                        } else {
                            state = 0;
                        }
                        break;
                    case 6: // </head
                        if (ch === '>' || ch === ' ') {
                            injectScriptAtIndex(i + 1 - '</head>'.length);
                            return;
                        } else {
                            state = 0;
                        }
                        break;
                    case 7: // </ht
                        if (ch === 'm' || ch === 'M') {
                            state = 8;
                        } else {
                            state = 0;
                        }
                        break;
                    case 8: // </htm
                        if (ch === 'l' || ch === 'L') {
                            state = 9;
                        } else {
                            state = 0;
                        }
                        break;
                    case 9: // </html
                        if (ch === '>' || ch === ' ') {
                            injectScriptAtIndex(i + 1 - '</html>'.length);
                            return;
                        } else {
                            state = 0;
                        }
                        break;
                    }
                }
                // No insertion point found, insert at end:
                injectScriptAtIndex(body.length);
            });
        } else {
            next();
        }
    };
};
