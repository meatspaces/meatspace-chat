'use strict';

var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var settings = require('./settings')(app, configurations, express);

nconf.argv().env().file({ file: 'local.json' });

/* Websocket setup */

var io = require('socket.io').listen(server);

io.configure(function () {
  io.set('transports', ['websocket', 'xhr-polling']);
  io.set('polling duration', 10);
  io.set('log level', 1);
});

/* Filters for routes */

var isLoggedIn = function (req, res, next) {
  if (req.session.email) {
    next();
  } else {
    res.redirect('/');
  }
};

require('express-persona')(app, {
  audience: nconf.get('domain') + ':' + nconf.get('authPort')
});

// routes
require('./routes')(app, io, isLoggedIn);

server.listen(process.env.PORT || nconf.get('port'));
