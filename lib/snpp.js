var sys = require('sys');

var debug;
var debugLevel = parseInt(process.env.NODE_DEBUG, 16);
if (debugLevel & 0x4) {
  debug = function (x) { sys.log('SNPP: ' + x); };
} else {
  debug = function () { };
}

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

function Server () {
  net.Server.call(this);

  var self = this;

  for(meth in METHODS) {
    self.addListener(meth.toLowerCase(), function (data) {
      debug('Method  ' + meth + ' is unimplemented');
      self.outputStatusMessage(500);
    });
  }

  self.addListener('newListener', function (meth, listener) {
    if(meth.toUpperCase() in METHODS) {
      debug('Method ' + meth + ' is now implemented')
      self.removeListener(meth, self.listeners(meth)[0]);
    }
  });

  self.addListener('connection', function (socket) {

    debug('New snpp connection');

    self.socket = socket;

    socket.setEncoding('ascii');

    self.outputStatusMessage(220)

    socket.addListener('data', function (data) {
      debug('Received data: ' + sys.inspect(data));
      meth = data.substring(0, 4).toUpperCase();
      if(methCallback =  METHODS[meth]) {
        data = methCallback(data.substring(5, data.length - 2))
        debug('Emitting ' + meth + ' with ' + data);
        self.emit(meth.toLowerCase(), data);
      } else {
        debug('Unknown method ' + meth);
        self.outputStatusMessage(500);
      }
    });

    socket.addListener('end', function () {
      self.closeConnection();
    });
  });
}
sys.inherits(Server, net.Server);
exports.Server = Server;

Server.prototype.outputStatusMessage = function (statusCode) {
  if(message = STATUS_CODES[statusCode]) {
    this.socket.write(statusCode + ' ' + message + CRLF);
  } else {
    throw new Error('Unknown status code: ' + statusCode);
  }
}

Server.prototype.closeConnection = function () {
  debug('Ending snpp connection');
  this.socket.end();
}


// Convenience factory method
exports.createServer = function () {
  return new Server();
};
