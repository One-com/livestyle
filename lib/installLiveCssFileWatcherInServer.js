var fs = require('fs'),
    path = require('path'),
    URL = require('url'),
    clientsByFileName = {},
    mtimeByFileName = {};

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

function clientToString(client) {
    return client.handshake.address.address + ':' + client.handshake.address.port;
}

module.exports = function (app, options, sio) {
    var io = sio.listen(app);
    if (!options.debug) {
        io.set('log level', 1);
    }
    io.sockets.on('connection', function (client) {
        if (options.debug) {
            console.warn('Client ' + clientToString(client) + ' connected');
        }
        client.on('watch', function (assetUrls) {
            if (options.debug) {
                console.warn('Client subscribed to ' + assetUrls.length + ' file(s):');
            }
            assetUrls.forEach(function (rootRelativePath) {
                if (options.debug) {
                    console.warn('  ' + rootRelativePath);
                }
                var mappedPath = rootRelativePath;
                if (options.mappings) {
                    Object.keys(options.mappings).forEach(function (url) {
                        if (rootRelativePath.indexOf(url) === 0) {
                            mappedPath = mappedPath.replace(url, options.mappings[url]);
                            if (options.debug) {
                                console.warn('    => rewritten to ' + mappedPath);
                            }
                        }
                    });
                }

                var fileName = path.resolve(options.documentRoot, mappedPath.substr(1));
                if (fileName in clientsByFileName) {
                    clientsByFileName[fileName].push(client);
                } else {
                    clientsByFileName[fileName] = [client];

                    function notifyWatchers () {
                        if (options.debug) {
                            console.warn(fileName + ' changed on disc');
                            if (clientsByFileName[fileName].length) {
                                console.warn('  Notifying ' + clientsByFileName[fileName].length + ' watcher(s):\n  ' +
                                             clientsByFileName[fileName].map(clientToString).join('\n  '));
                            }
                        }
                        clientsByFileName[fileName].forEach(function (client) {
                            client.emit('change', rootRelativePath);
                        });
                    }

                    if (options.debug) {
                        console.warn('    Starting to watch ' + fileName + ' using ' + ((fs.watch && !options.watchfile) ? 'fs.watch' : 'fs.watchFile'));
                    }
                    if (fs.watch && !options.watchfile) {
                        fs.watch(fileName, function handleWatchNotification(event) {
                            // Resubscribe if the file is renamed (Mac OSX):
                            if (event === 'rename') {
                                fs.watch(fileName, handleWatchNotification);
                            }
                            if (!(fileName in mtimeByFileName)) {
                                mtimeByFileName[fileName] = Infinity;
                                notifyWatchers();
                            } else {
                                fs.stat(fileName, function (err, stats) {
                                    if (err) {
                                        return;
                                    }
                                    if (stats.mtime > mtimeByFileName[fileName]) {
                                        notifyWatchers();
                                    } else if (options.debug) {
                                        console.warn("Ignoring " + event + " from fs.watch, the mtime of the file is still the same");
                                    }
                                    mtimeByFileName[fileName] = stats.mtime;
                                });
                            }
                        });
                    } else {
                        // TODO: Poll the upstream server if the file isn't found on disc (or no documentRoot is specified)
                        fs.watchFile(fileName, function (currStat, prevStat) {
                            if (currStat.mtime.getTime() !== prevStat.mtime.getTime()) {
                                notifyWatchers();
                            }
                        });
                    }
                }
            });
        }).on('disconnect', function () {
            if (options.debug) {
                console.warn('client disconnected');
            }
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
