'use strict';

module.exports = function (app, nconf, io) {
  var crypto = require('crypto');
  var Publico = require('meatspace-publico');
  var nativeClients = require('../clients.json');
  var level = require('level');

  var logger = level(nconf.get('logger'), {
    createIfMissing: true,
    valueEncoding: 'json'
  });

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

  var emitChat = function (socket, chat) {
    socket.emit('message', { chat: chat });
  };

  app.get('/info', function (req, res) {
    res.render('info');
  });

  app.get('/art', function (req, res) {
    res.render('art');
  });

  app.get('/', function (req, res) {
    // Fire out an initial burst of images to the connected client, assuming there are any available
    getSortedChats(function (err, results) {
      var currDate = Date.now();
      logger.put('landing-page!' + currDate, {
        ip: req.ip,
        created: currDate
      });
      if (err) {
        res.render('index');
      } else {
        res.render('index', { chats: results.chats });
      }
    });
  });

  // NOTE: This is now a deprecated API method -- All chats go out through web sockets
  app.get('/get/chats', function (req, res) {
    res.status(410);
    res.json({ error: 'This method is now deprecated. All chat messages, including initial ones, are now emitted through web socket messages.' });
  });

  app.get('/ip', function (req, res) {
    res.json({
      ip: req.ip
    });
  });

  var addChat = function (message, picture, fingerprint, userId, ip, next) {
    publico.addChat(message.slice(0, 250), {
      ttl: 600000,
      media: picture,
      fingerprint: userId
    }, function (err, c) {
      if (err) {
        next(err);
      } else {
        try {
          emitChat(io.sockets, { key: c.key, value: c });
          next(null, 'sent!');
        } catch (err) {
          next(new Error('Could not emit message'));
        }
      }
    });
  };

  app.post('/add/chat', function (req, res, next) {
    var ip = req.ip || '0.0.0.0';
    var userId = crypto.createHash('md5').update(req.body.fingerprint + ip).digest('hex');

    if (req.body.picture) {
      if ((userId && userId === req.body.userid) || req.body.apiKey) {
        addChat(req.body.message, req.body.picture, req.body.fingerprint, userId, ip, function (err, status) {
          if (err) {
            res.status(400);
            res.json({ error: err.toString() });
          } else {
            var currDate = Date.now();
            logger.put('web!' + currDate, {
              ip: ip,
              fingerprint: userId,
              created: currDate
            });

            res.json({ status: status });
          }
        });
      } else {
        res.status(403);
        res.json({ error: 'invalid fingerprint' });
      }
    } else {
      res.status(400);
      res.json({ error: 'you need webrtc' });
    }
  });

  io.sockets.on('connection', function (socket) {
    socket.on('message', function (data) {
      if (nativeClients.indexOf(data.apiKey) > -1) {
        var ip = '0.0.0.0';

        addChat(data.message, data.picture, data.fingerprint, data.fingerprint, ip, function (err) {
          if (err) {
            console.log('error posting ', err.toString());
          } else {
            var currDate = Date.now();
            logger.put('api!' + currDate, {
              ip: ip,
              fingerprint: data.fingerprint,
              created: currDate
            });
          }
        });
      } else {
        console.log('Invalid apiKey');
      }
    });
  });
};
