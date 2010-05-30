Node.js SNPP Server
==============

An SNPP (level 1) server library for Node.js.

[rq]: http://github.com/jsanders/node-snpp

Installation
--------------

Clone or otherwise download library and symlink or copy snpp.js into your ~/.node_libraries directory.

Usage
---------------
    var snpp = require('snpp');
    snpp.createServer(function (request, response) {
      // Handle 'PAGE' command
      request.addListener('page', function () {
        // request.pager contains pager number
      });

      // Handle 'MESS' command
      request.addListener('mess', function () {
        // request.pager contains pager number, request.message contains message
      });

      // Handle 'SEND' command
      request.addListener('send', function () {
        // request.pager contains pager number, request.message contains message
      });

      // Handle 'QUIT' command
      request.addListener('send', function () {
        // request.pager contains pager number, request.message contains message
      });
    }).listen('444', 'localhost');

Examples can be found in the examples directory.

License
---------------

(The MIT License)

Copyright (c) 2009

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
