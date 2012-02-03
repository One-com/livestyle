var fs = require('fs'),
    path = require('path'),
    URL = require('url'),
    clientsByFileName = {};

function buildRelativeUrl(fromUrl, toUrl) {
    var minLength = Math.min(fromUrl.length, toUrl.length),
        commonPrefixLength = 0;
    while (commonPrefixLength < minLength && fromUrl[commonPrefixLength] === toUrl[commonPrefixLength]) {
        commonPrefixLength += 1;
    }
    var commonPrefix = fromUrl.substr(0, commonPrefixLength),
        commonPrefixMatch = commonPrefix.match(/^(file:\/\/|[^:]+:\/\/[^\/]+\/)/);

    if (commonPrefixMatch) {
        var fromFragments = fromUrl.substr(commonPrefixMatch[1].length).replace(/^\/+/, "").replace(/[^\/]+$/, "").split(/\//),
            toFragments = toUrl.substr(commonPrefixMatch[1].length).replace(/^\/+/, "").split(/\//);

        fromFragments.pop();

        var i = 0;
        while (i < fromFragments.length && i < toFragments.length && fromFragments[i] === toFragments[i]) {
            i += 1;
        }
        var relativeUrl = toFragments.slice(i).join("/");
        while (i < fromFragments.length) {
            relativeUrl = '../' + relativeUrl;
            i += 1;
        }
        return relativeUrl;
    } else {
        return toUrl; // No dice
    }
}

module.exports = function (app, options, sio) {
    var io = sio.listen(app);
    io.sockets.on('connection', function (client) {
        client.on('watch', function (assetUrls) {
            assetUrls.forEach(function (rootRelativePath) {
                if (options.mappings) {
                    Object.keys(options.mappings).forEach(function (url) {
                        if (rootRelativePath.indexOf(url) === 0) {
                            console.log("Rewriting ", rootRelativePath, "to", rootRelativePath.replace(url, mappings[url]));
                            rootRelativePath = rootRelativePath.replace(url, mappings[url]);
                        }
                    });
                }

                var fileName = path.resolve(options.documentRoot, rootRelativePath.substr(1));
                if (fileName in clientsByFileName) {
                    clientsByFileName[fileName].push(client);
                } else {
                    clientsByFileName[fileName] = [client];

                    // TODO: Poll the upstream server if the file isn't found on disc (or no documentRoot is specified)
                    fs.watchFile(fileName, function (currStat, prevStat) {
                        if (currStat.mtime.getTime() !== prevStat.mtime.getTime()) {
                            clientsByFileName[fileName].forEach(function (client) {
                                client.emit('change', rootRelativePath);
                            });
                        }
                    });
                }
            });
        }).on('disconnect', function () {
            Object.keys(clientsByFileName).forEach(function (fileName) {
                var clients = clientsByFileName[fileName],
                    clientIndex = clients.indexOf(client);
                if (clientIndex !== -1) {
                    clients.splice(clientIndex, 1);
                }
            });
        });
    });
};
