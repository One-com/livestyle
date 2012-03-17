var fs = require('fs'),
    path = require('path'),
    URL = require('url');

if (!path.relative) {
    // Add path.relative for node.js < 0.6 (taken from 0.6.13)
    // path.relative(from, to)
    path.relative = function(from, to) {
        from = path.resolve(from).substr(1);
        to = path.resolve(to).substr(1);

        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== '') break;
            }

            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== '') break;
            }

            if (start > end) return [];
            return arr.slice(start, end - start + 1);
        }

        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));

        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
            }
        }

        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push('..');
        }

        outputParts = outputParts.concat(toParts.slice(samePartsLength));

        return outputParts.join('/');
    };
}

function clientToString(client) {
    return client.handshake.address.address + ':' + client.handshake.address.port;
}

module.exports = function (app, options, sio) {
    var io = sio.listen(app),
        clientsByFileName = {},
        isWatchedByDirName = {},
        mtimeByFileName = {};

    function notifyWatchers(fileName) {
        if (fileName in clientsByFileName) {
            var rootRelativePath = '/' + path.relative(options.documentRoot, fileName);
            if (options.debug && clientsByFileName[fileName].length) {
                console.warn('  Notifying ' + clientsByFileName[fileName].length + ' watcher(s):\n  ' +
                             clientsByFileName[fileName].map(clientToString).join('\n  '));
            }
            clientsByFileName[fileName].forEach(function (client) {
                client.emit('change', rootRelativePath);
            });
        }
    }

    function notifyWatchersIfMtimeIncreased(fileName) {
        if (fileName in clientsByFileName) {
            if (!(fileName in mtimeByFileName)) {
                mtimeByFileName[fileName] = Infinity;
                notifyWatchers(fileName);
            } else {
                fs.stat(fileName, function (err, stats) {
                    if (err) {
                        return;
                    }
                    if (stats.mtime > mtimeByFileName[fileName]) {
                        notifyWatchers(fileName);
                    } else if (options.debug) {
                        console.warn('Suppressing notification for ' + fileName + ', the mtime of the file is still the same');
                    }
                    mtimeByFileName[fileName] = stats.mtime;
                });
            }
        }
    }

    if (!options.debug) {
        io.set('log level', 1);
    }
    io.sockets.on('connection', function (client) {
        if (options.debug) {
            console.warn('Client ' + clientToString(client) + ' connected');
        }
        client.on('watch', function (rootRelativePaths) {
            if (options.debug) {
                console.warn('Client subscribed to ' + rootRelativePaths.length + ' file(s):');
            }
            rootRelativePaths.forEach(function (rootRelativePath) {
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

                    if (fs.watch && !options.watchfile) {
                        var dirName = path.dirname(fileName);
                        if (!isWatchedByDirName[dirName]) {
                            if (options.debug) {
                                console.warn('Starting to ' + dirName + ' using fs.watch');
                            }
                            fs.watch(dirName, function (eventName, fileName) {
                                fileName = path.resolve(dirName, fileName); // Absolutify fileName
                                if (options.debug) {
                                    console.warn('fs.watch: ' + eventName + ' ' + fileName);
                                }
                                if (options.mtime) {
                                    notifyWatchersIfMtimeIncreased(fileName);
                                } else {
                                    notifyWatchers(fileName);
                                }
                            });
                        }
                    } else {
                        // TODO: Poll the upstream server if the file isn't found on disc (or no documentRoot is specified)
                        if (options.debug) {
                            console.warn('Starting to watch ' + fileName + ' using fs.watchFile');
                        }
                        fs.watchFile(fileName, function (currStat, prevStat) {
                            if (options.debug) {
                                console.warn('fs.watchFile: ' + fileName + ' changed on disc');
                            }
                            if (currStat.mtime.getTime() !== prevStat.mtime.getTime()) {
                                notifyWatchers(fileName);
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
