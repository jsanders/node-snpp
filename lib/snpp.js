var sys = require('sys');
var events = require('events');

var debug;
var debugLevel = parseInt(process.env.NODE_DEBUG, 16);
if (debugLevel & 0x4) {
  debug = function (x) { sys.log('SNPP: ' + x); };
} else {
  debug = function () { };
}

function debugSock(message, socket) { debug(message + ' for ' + socket.remoteAddress + ':' + socket.remotePort); }

var net = require('net');

var CRLF = "\r\n";
//Status codes from RFC 1861, and default messages
var STATUS_CODES = exports.STATUS_CODES = {
  214 : 'Multi-line message',                 // Should appear more than once and be terminated with 250 Ok
  220 : 'Ready',                              // Ready for commands to be sent
  218 : 'Single-line message',                // Should only appear once, requires no terminating code
  221 : 'Goodbye',                            // Acknowledge quit
  250 : 'OK',                                 // Used as a general positive acknowledgment
  421 : 'Fatal Error, Connection Terminated', // Sent just prior to server terminating client connection
  500 : 'Command Not Implemented',            // Illegal command, fail but continue
  503 : 'Duplicate Command Entry',            // Sent when a command expected once is sent more than once
  550 : 'Administrative Transaction Failure', // Transaction failed for administrative reason, ie. invalid pager ID
  554 : 'Technical Transaction Failure',      // Transaction failed for technical reason, ie. gateway down
  552 : 'Maximum Entries Exceeded'            // For instance 6 PAGE commands on a terminal that only supports 5
};

var METHODS = exports.METHODS = {
  'PAGE' : function (data) { return data; },
  'MESS' : function (data) { return data; },
  'SEND' : function (data) {},
  'QUIT' : function (data) {}
}

function Request (socket, response) {
  events.EventEmitter.call(this, socket);
  var self = this;

  self.socket = socket;
  self.response = response;

  socket.addListener('data', function (data) {
    debugSock('Received data: ' + sys.inspect(data), this);
    meth = data.substring(0, 4).toUpperCase();
    if(methCallback =  METHODS[meth]) {
      data = methCallback(data.substring(5, data.length - 2))
      debugSock('Emitting "' + meth.toLowerCase() + '" with ' + data, this);
      self.emit(meth.toLowerCase(), data);
    } else {
      debugSock('Unknown method ' + meth, this);
      self.response.statusCode = 500;
      endMethod(response);
    }
  });
}
sys.inherits(Request, events.EventEmitter);
exports.Request = Request;

function Response (socket) {
  events.EventEmitter.call(this, socket);
  var self = this;

  self.socket = socket;
  self.statusCode = 220;
  self.message;
}
sys.inherits(Response, events.EventEmitter);
exports.Response = Response;

function respondNow (res, statusCode, message) {
  if(statusCode === undefined) { throw new Error('Status code must be given') }
  if(message === undefined) { throw new Error('Message must be given') }

  res.socket.write(statusCode + ' ' + message + CRLF);
}

function endMethod (res) {
  if(defaultMessage = STATUS_CODES[res.statusCode]) {
    var message;
    if(res.message === undefined) {
      message = defaultMessage
    } else {
      message = res.message
    }

    respondNow(res, res.statusCode, message);

    res.message = undefined;
  } else {
    throw new Error('Unknown status code: ' + statusCode);
  }
}

function end (res) {
  endMethod(res);
  res.socket.end();
}

function Server (requestListener) {
  net.Server.call(this);
  var self = this;

  self.addListener('listening', function () { debug('Listening...'); });

  if(requestListener) {
    self.addListener('request', requestListener);
  }

  self.addListener('connection', function (socket) {
    debugSock('New snpp connection', socket );

    // TODO The RFC does not discuss encodings - is this safe?
    socket.setEncoding('ascii');

    socket.addListener('error', function (e) {
      // ENOTCONN - client disconnected
      if(e.errno == 57) {
        debugSock('Client appears to have disconnected', this);
      } else {
        self.emit('clientError', e);
      }
    });

    var res = new Response(socket);
    var req = new Request(socket, res);

    req.addListener('page', function (pager) {
      debugSock('Pre-processing "PAGE"', req.socket);
      req.pager = pager;
      res.statusCode = 250;
    });

    req.addListener('mess', function (message) {
      debugSock('Pre-processing "MESS"', req.socket);
      req.message = message;
      res.statusCode = 250;
    });

    req.addListener('send', function () {
      debugSock('Pre-processing "SEND"', req.socket);
      res.statusCode = 250;
    });

    req.addListener('quit', function () {
      debugSock('Pre-processing "QUIT"', req.socket);
      res.statusCode = 221;
    });

    // Let the client know we're ready
    endMethod(res);

    self.emit('request', req, res);
  });

  self.addListener('request', function (req, res) {
    // Finish up the response to a method
    for(meth in METHODS) {
      req.addListener(meth.toLowerCase(), function () {
        debugSock('Post-processing "' + meth + '"', req.socket);
        if(meth == 'QUIT' || res.statusCode == 421) {
          end(res);
        } else {
          endMethod(res);
        }
      });
    }
  });

}
sys.inherits(Server, net.Server);
exports.Server = Server;

// Convenience factory method
exports.createServer = function (requestListener) {
  return new Server(requestListener);
};
