'use strict';

var zmq = require('zmq');
var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var settings = require('./settings')(app, configurations, express);

nconf.argv().env().file({ file: 'local.json' });

// set up meatcounter publisher
var meatcounter_addr = nconf.get('meatcounter_addr');
var zio = zmq.socket('pub');
zio.connect(meatcounter_addr);

var topic_in = nconf.get('meatcounter_inc_topic');
var topic_out = nconf.get('meatcounter_out_topic');

// set up websocket
var io = require('socket.io').listen(server);

io.configure(function () {
  io.set('transports', ['websocket']);
  io.set('polling duration', 10);
  io.set('log level', 1);
});

// routes
require('./routes')(app, nconf, io, zio, topic_in, topic_out);

server.listen(process.env.PORT || nconf.get('port'));
