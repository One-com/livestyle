/**
 * Middleware that buffers up the request's 'data' and 'end' events
 * until another 'data' listener is added, then replay the events in
 * order.
 *
 * Intended for use with formidable in scenarios where the IncomingForm
 * is initialized in a route after something async has happened
 * (authentication via a socket, for instance).
 */

function createEventBufferer(eventName, bufferedEvents) {
    return function () { // ...
        bufferedEvents.push([eventName].concat(Array.prototype.slice.call(arguments)));
    };
}

var eventNamesToBuffer = ['data', 'end'];

module.exports = function () {
    return function bufferDataEventsUntilFirstListener(req, res, next) {
        var eventBufferersByEventName = {},
            bufferedEvents = [];
        eventNamesToBuffer.forEach(function (eventName) {
            var eventBufferer = createEventBufferer(eventName, bufferedEvents);
            req.on(eventName, eventBufferer);
            eventBufferersByEventName[eventName] = eventBufferer;
        });
        req.on('newListener', function (name, listener) {
            if (name === 'data') {
                eventNamesToBuffer.forEach(function (eventName) {
                    req.removeListener(eventName, eventBufferersByEventName[eventName]);
                });
                process.nextTick(function () {
                    bufferedEvents.forEach(function (bufferedEvent) {
                        req.emit.apply(req, bufferedEvent);
                    });
                });
            }
        });
        next();
    };
};
