var sys = require('sys');
var snpp = require('../lib/snpp');

function logWithSocket(message, socket) { sys.log(message + ' for ' + socket.remoteAddress + ':' + socket.remotePort); }
snpp.createServer(function (req, res) {
  req.addListener('page', function () {
    logWithSocket('Handling PAGE command for pager: ' + req.pager, req.socket);
    if(/^666/.test(req.pager)) {
      // Fatal error, disconnect
      res.statusCode = 421;
      res.message = 'Only Satan allowed to send pages to numbers beginning 666'
    }
  });

  req.addListener('mess', function () {
    logWithSocket('Handling MESS command for message: ' + req.message, req.socket);
    if(req.message.length > 5) {
      // Administrative error, may try again
      res.statusCode = 550;
      res.message = 'TL;DR'
    }
  });

  req.addListener('send', function () {
    logWithSocket('Sending message "' + req.message + '" to pager at ' + req.pager, req.socket);
    if(Math.floor(Math.random() * 11) < 4) {
      // Technical error, may try again
      res.statusCode = 554;
      res.message = 'I randomly fail sometimes, please try again';
    }
  });

  req.addListener('quit', function () {
    logWithSocket('Quitting', req.socket);
  });
}).listen('444', 'localhost');
