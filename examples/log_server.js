var sys = require('sys');
var snpp = require('../lib/snpp');
var server = snpp.createServer();

var pager, message;

server.addListener('page', function (_pager) {
  pager = _pager;
  sys.log('Handling PAGE command for pager: ' + pager);
  server.outputStatusMessage(250);
});

server.addListener('mess', function (_message) {
  message = _message;
  sys.log('Handling MESS command with message: ' + message);
  server.outputStatusMessage(250);
});

server.addListener('send', function () {
  sys.log('Sending message "' + message + '" to pager at ' + pager);
  server.outputStatusMessage(250);
});

server.addListener('quit', function () {
  sys.log('Quitting');
  server.outputStatusMessage(221);
  server.closeConnection();
});

server.listen('444', 'localhost');
