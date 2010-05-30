var sys = require('sys');
var snpp = require('../lib/snpp');

function logWithSocket(message, socket) { sys.log(message + ' for ' + socket.remoteAddress + ':' + socket.remotePort); }
snpp.createServer(function (req, res) {
  req.addListener('page', function () {
    logWithSocket('Handling PAGE command for pager: ' + req.pager, req.socket);
  });

  req.addListener('mess', function () {
    logWithSocket('Handling MESS command for message: ' + req.message, req.socket);
  });

  req.addListener('send', function () {
    logWithSocket('Sending message "' + req.message + '" to pager at ' + req.pager, req.socket);
  });

  req.addListener('quit', function () {
    logWithSocket('Quitting', req.socket);
  });
}).listen('444', 'localhost');
