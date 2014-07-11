'use strict';

module.exports = function (app, nconf, io, zio, topic_in, topic_out, passport, isLoggedIn) {
  var crypto = require('crypto');
  var Publico = require('meatspace-publico');
  var nativeClients = require('../clients.json');
  var whitelist = require('../whitelist.json');
  var level = require('level');
  var redis = require('redis');
  var client = redis.createClient();

  var getUserId = function(fingerprint, ip) {
    return crypto.createHash('md5').update(fingerprint + ip).digest('hex');
  };

  var publico = new Publico('none', {
    db: './db',
    limit: 20
  });

  var getSortedChats = function (done){
    publico.getChats(true, function (err, c) {
      if (err) {
        done(err);
      } else {
        if (c.chats && c.chats.length > 0) {
          c.chats.reverse();
        }
        done(null, c);
      }
    });
  };

  var emitChat = function (socket, chat, zio, topic_out) {
    var fingerprint = chat.value.fingerprint;

    client.scard('bans:' + fingerprint, function (err, result) {
      if (!err) {
        if (result > 2) {
          console.log('banned! ', fingerprint);
          chat.value.banned = true;
        }
      }

      var statmsg = JSON.stringify({
        epoch_ms: Date.now(),
        fingerprint: fingerprint
      });

      zio.send([topic_out, statmsg]);

      socket.emit('message', { chat: chat });
    });
  };

  app.get('/auth/twitter', passport.authenticate('twitter'), function (req, res) { });

  app.get('/auth/twitter/callback', passport.authenticate('twitter',
    { failureRedirect: '/' }), function (req, res) {

    if (whitelist.indexOf(req.session.passport.user.id) === -1) {
      res.redirect('/logout');
    } else {
      req.session.userId = req.session.passport.user.id;
      req.session.authenticated = true;
      res.redirect('/');
    }
  });

  app.get('/logout', function (req, res) {
    req.session.destroy();
    req.logout();
    res.redirect('/');
  });

  app.get('/admin', function (req, res) {
    res.render('admin');
  });

  app.get('/info', function (req, res) {
    res.render('info');
  });

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.post('/hellban', isLoggedIn, function (req, res) {
    var ban = 'bans:' + req.body.fingerprint;
    var adminId = req.session.passport.user.id;

    client.sadd(ban, adminId);
    client.expire(ban, nconf.get('ban_ttl'));
    res.json({});
  });

  // NOTE: This is now a deprecated API method -- All chats go out through web sockets
  app.get('/get/chats', function (req, res) {
    res.status(410);
    res.json({
      error: 'This method is now deprecated. All chat messages, including initial ones, are now emitted through web socket messages.'
    });
  });

  app.get('/ip', function (req, res) {
    res.json({
      ip: req.ip,
      admin: req.session.authenticated || false
    });
  });

  app.get('/terms', function (req, res) {
    res.render('terms');
  });

  var addChat = function (message, picture, userId, ip, next) {
    publico.addChat(message.slice(0, 250), {
      ttl: nconf.get('ttl') || 600000,
      media: picture,
      fingerprint: userId
    }, function (err, c) {
      if (err) {
        next(err);
      } else {
        try {
          var statmsg = JSON.stringify({
            epoch_ms: Date.now(),
            fingerprint: userId
          });

          zio.send([topic_in, statmsg]);
          emitChat(io.sockets, { key: c.key, value: c }, zio, topic_out);
          next(null, 'sent!');
        } catch (err) {
          next(new Error('Could not emit message'));
        }
      }
    });
  };

  app.post('/add/chat', function (req, res, next) {
    if (!req.isApiUser && req.body.fingerprint && req.body.fingerprint.length > 10) {
      // client is sending a fingerprint that's longer than we would ever receive from fingerprintjs
      // which means they're likely trying to generate MD5 collisions with other clients
      res.status(403);
      res.json({ error: 'invalid fingerprint' });
      return;
    }

    var ip = req.ip;
    var userId = getUserId(req.body.fingerprint, ip);
    var picture = req.body.picture;

    if (picture) {
      if (picture.indexOf('data:image/') !== 0) {
        res.status(400);
        res.json({ error: 'Invalid image type' });
        return;
      }
      req.body.message = req.body.message.replace(/[\r\n\t]/g,'');

      addChat(req.body.message, picture, userId, ip, function (err, status) {
        if (err) {
          res.status(400);
          res.json({ error: err.toString() });
        } else {
          client.set('fingerprint:' + req.body.fingerprint, userId);
          res.json({ status: status, fingerprint: userId });
        }
      });
    } else {
      res.status(400);
      res.json({ error: 'you need webrtc' });
    }
  });

  io.sockets.on('connection', function (socket) {
    var ip = socket.handshake.address.address;
    if (socket.handshake.headers['x-forwarded-for']) {
      ip = socket.handshake.headers['x-forwarded-for'].split(/ *, */)[0];
    }

    // Fire out an initial burst of images to the connected client, assuming there are any available
    getSortedChats(function (err, results) {
      if (results.chats && results.chats.length > 0) {
        try {
          results.chats.forEach(function (chat) {
            emitChat(socket, chat, zio, topic_out);
          });
        } catch (e) {
          if (typeof results.chats.forEach !== 'function') {
            console.log('chats is type of ', typeof results.chats, ' and somehow has length ', results.chats.length);

            if (typeof results.chats === 'string') {
              console.log('results.chats appears to be a string');
            }
          }
        }
      }
    });

    socket.on('message', function (data) {
      if (nativeClients.indexOf(data.apiKey) > -1) {
        var userId = getUserId(data.fingerprint, ip);
        addChat(data.message, data.picture, userId, ip, function (err) {
          if (err) {
            console.log('error posting ', err.toString());
          }
        });
      } else {
        console.log('Invalid apiKey');
      }
    });
  });
};
