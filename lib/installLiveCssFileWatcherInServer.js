var fs = require('fs'),
    path = require('path');

function clientToString(client) {
    return client.handshake.address.address + ':' + client.handshake.address.port;
}

module.exports = function (app, options, sio) {
    var io = sio.listen(app, { log: !options.silentSocketIo }),
        clientsByRootRelativeUrl = {},
        rootRelativeUrlsByFileName = {}, // Map to translate file names reported by fs.watch into known root relative urls
        isWatchedByDirName = {},
        mtimeByFileName = {};

    function notifyWatchers(rootRelativeUrl) {
        if (rootRelativeUrl in clientsByRootRelativeUrl) {
            if (options.debug && clientsByRootRelativeUrl[rootRelativeUrl].length) {
                console.warn('  Notifying ' + clientsByRootRelativeUrl[rootRelativeUrl].length + ' watcher(s):\n  ' +
                             clientsByRootRelativeUrl[rootRelativeUrl].map(clientToString).join('\n  '));
            }
            clientsByRootRelativeUrl[rootRelativeUrl].forEach(function (client) {
                client.emit('change', rootRelativeUrl);
            });
        }
    }

    function notifyWatchersIfMtimeIncreased(rootRelativeUrl, fileName) {
        if (rootRelativeUrl in clientsByRootRelativeUrl) {
            if (!(fileName in mtimeByFileName)) {
                mtimeByFileName[fileName] = Infinity;
                notifyWatchers(rootRelativeUrl);
            } else {
                fs.stat(fileName, function (err, stats) {
                    if (err) {
                        return;
                    }
                    if (stats.mtime > mtimeByFileName[fileName]) {
                        notifyWatchers(rootRelativeUrl);
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
        client.on('watch', function (rootRelativeUrls) {
            if (options.debug) {
                console.warn('Client subscribed to ' + rootRelativeUrls.length + ' file(s):');
            }
            rootRelativeUrls.forEach(function (rootRelativeUrl) {
                if (options.debug) {
                    console.warn('  ' + rootRelativeUrl);
                }
                var mappedUrl = rootRelativeUrl.replace(/\?.*$/, '');
                if (options.mappings) {
                    Object.keys(options.mappings).every(function (url) {
                        if (mappedUrl.indexOf(url) === 0) {
                            mappedUrl = mappedUrl.replace(url, options.mappings[url]);
                            if (options.debug) {
                                console.warn('    => rewritten to ' + mappedUrl);
                            }
                            return false;
                        }
                        return true;
                    });
                }

                if (/\/$/.test(mappedUrl)) {
                    mappedUrl += 'index.html';
                }

                // Trim the leading slash if it exists
                mappedUrl = mappedUrl[0] === '/' ? mappedUrl.substr(1) : mappedUrl;

                var rootRelativePath = decodeURIComponent(mappedUrl),
                    fileName = path.resolve(options.root, rootRelativePath);

                rootRelativeUrlsByFileName[fileName] = rootRelativeUrlsByFileName[fileName] || [];
                if (rootRelativeUrlsByFileName[fileName].indexOf(rootRelativeUrl) === -1) {
                    rootRelativeUrlsByFileName[fileName].push(rootRelativeUrl);
                }
                if (rootRelativeUrl in clientsByRootRelativeUrl) {
                    clientsByRootRelativeUrl[rootRelativeUrl].push(client);
                } else {
                    clientsByRootRelativeUrl[rootRelativeUrl] = [client];
                    if (fs.watch && !options.watchfile) {
                        if (process.platform === 'linux' || process.platform === 'win32') {
                            var dirName = path.dirname(fileName);
                            if (!isWatchedByDirName[dirName]) {
                                isWatchedByDirName[dirName] = true;
                                if (options.debug) {
                                    console.warn('Starting to watch ' + dirName + ' using fs.watch');
                                }
                                try {
                                    fs.watch(dirName, function (eventName, fileName) {
                                        fileName = path.resolve(dirName, fileName); // Absolutify fileName
                                        if (options.debug) {
                                            console.warn('fs.watch: ' + eventName + ' ' + fileName);
                                        }
                                        (rootRelativeUrlsByFileName[fileName] || []).forEach(function (rootRelativeUrl) {
                                            if (options.mtime) {
                                                notifyWatchersIfMtimeIncreased(rootRelativeUrl, fileName);
                                            } else {
                                                notifyWatchers(rootRelativeUrl);
                                            }
                                        });
                                    });
                                } catch (err) {
                                    console.error("Error trying to watch " + dirName + " using fs.watch: " + err.code);
                                    if (options.debug) {
                                        console.error(err.stack);
                                    }
                                }
                            }
                        } else {
                            if (options.debug) {
                                console.warn('Starting to watch ' + fileName + ' using fs.watch');
                            }
                            try {
                                var fsWatcher = fs.watch(fileName, function handleWatchNotification(eventName) {
                                    // Resubscribe if the file is renamed (Mac OSX):
                                    if (eventName === 'rename') {
                                        fsWatcher.close();
                                        fsWatcher = fs.watch(fileName, handleWatchNotification);
                                    }
                                    if (options.mtime) {
                                        notifyWatchersIfMtimeIncreased(rootRelativeUrl, fileName);
                                    } else {
                                        notifyWatchers(rootRelativeUrl);
                                    }
                                });
                            } catch (err) {
                                console.error("Error trying to watch " + fileName + " using fs.watch: " + err.code);
                                if (options.debug) {
                                    console.error(err.stack);
                                }
                            }
                        }
                    } else {
                        // TODO: Poll the upstream server if the file isn't found on disc (or no root is specified)
                        if (options.debug) {
                            console.warn('Starting to watch ' + fileName + ' using fs.watchFile');
                        }
                        try {
                            fs.watchFile(fileName, function (currStat, prevStat) {
                                if (options.debug) {
                                    console.warn('fs.watchFile: ' + fileName + ' changed on disc');
                                }
                                if (currStat.mtime.getTime() !== prevStat.mtime.getTime()) {
                                    notifyWatchers(rootRelativeUrl);
                                }
                            });
                        } catch (err) {
                            console.error("Error trying to watch " + fileName + " using fs.watchFile: " + err.code);
                            if (options.debug) {
                                console.error(err.stack);
                            }
                        }
                    }
                }
            });
        }).on('disconnect', function () {
            if (options.debug) {
                console.warn('client disconnected');
            }
            Object.keys(clientsByRootRelativeUrl).forEach(function (rootRelativeUrl) {
                var clients = clientsByRootRelativeUrl[rootRelativeUrl],
                    clientIndex = clients.indexOf(client);
                if (clientIndex !== -1) {
                    clients.splice(clientIndex, 1);
                }
            });
        });
    });
};
