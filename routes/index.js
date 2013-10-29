'use strict';

module.exports = function (app, io) {
  var crypto = require('crypto');
  var Publico = require('meatspace-publico');
  var nativeClients = require('../clients.json');

  var publico = new Publico('none', {
    db: './db',
    limit: 20
  });

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.get('/get/chats', function (req, res) {
    publico.getChats(false, function (err, c) {
      if (err) {
        res.status(400);
        res.json({ error: err.toString() });
      } else {
        res.json({ chats: c });
      }
    });
  });

  app.get('/ip', function (req, res) {
    res.json({
      ip: req.connection.remoteAddress
    });
  });

  var addChat = function (message, picture, fingerprint, next) {
    publico.addChat(message.slice(0, 150), {
      ttl: 600000,
      media: picture,
      fingerprint: fingerprint
    }, function (err, c) {
      if (err) {
        next(err);
      } else {
        try {
          io.sockets.emit('message', {
            chat: {
              key: c.key,
              value: {
                fingerprint: fingerprint,
                created: c.created,
                media: c.media,
                ttl: c.ttl,
                message: c.message
              }
            }
          });

          next(null, 'sent!');
        } catch (err) {
          next(new Error('Could not emit message'));
        }
      }
    });
  };

  app.post('/add/chat', function (req, res, next) {
    if (req.body.picture) {
      var userId = crypto.createHash('md5').update(req.body.fingerprint + req.connection.remoteAddress).digest('hex');

      if (userId === req.body.userid) {

        addChat(req.body.message, req.body.picture, userId, function (err, status) {
          if (err) {
            res.status(400);
            res.json({ error: err.toString() });
          } else {
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

        addChat(data.message, data.picture, data.fingerprint, function (err) {
          if (err) {
            console.log('error posting ', err.toString());
          }
        });
      } else {
        console.log('Invalid apiKey: ', data.apiKey);
      }
    });
  });
};
