'use strict';

var zmq = require('zmq');
var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var settings = require('./settings')(app, configurations, express);

nconf.argv().env().file({ file: 'local.json' });

/* Passport OAuth setup */
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new TwitterStrategy({
    consumerKey: nconf.get('twitter_key'),
    consumerSecret: nconf.get('twitter_secret'),
    callbackURL: nconf.get('domain') + ':' + nconf.get('authPort') + '/auth/twitter/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function (err) {
      if (!profile.access_token) {
        profile.access_token = accessToken;
      }

      return done(err, profile);
    });
  }
));

// set up meatcounter publisher and connect
// to endpoints
var meatcounter_addrs = nconf.get('meatcounter_addrs');
var zio = zmq.socket('pub');
for (var i = 0; i < meatcounter_addrs.length; i ++) {
  zio.connect(meatcounter_addrs[i]);
}

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
require('./routes')(app, nconf, io, zio, topic_in, topic_out, passport);

server.listen(process.env.PORT || nconf.get('port'));
