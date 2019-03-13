const EventEmitter = require('events').EventEmitter;
const restify = require('restify');
const errors = require('restify-errors');

let port = 3000;

class ServerSentEvent extends EventEmitter { }
const serverSentEvent = new ServerSentEvent();

let server = new restify.createServer({

});

server.use(
    function crossOrigin(req,res,next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      return next();
    }
);
server.use(restify.plugins.jsonBodyParser());

server.get('/events', (req, res, next) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    var handler = function(command) {
        res.write(`data: ${command}\n\n`);
    }
    serverSentEvent.on('event', handler);
    console.log('opening event-stream; listeners: ' + serverSentEvent.listenerCount('event'));
    res.on('close', () => {
        console.log('closing event-stream; listeners: ' + serverSentEvent.listenerCount('event'));
        serverSentEvent.removeListener('event', handler);
        next();
    });
});

// { command: '' }
server.post('/events', (req, res, next) => {
    if (!req.header('Content-Type', 'application/json')) {
        return new errors.InternalError("Invalid content-type");
    }

    if (req.body.command) {
        serverSentEvent.emit('event', req.body.command);
    }
    res.send(200);
    return next();

});

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
