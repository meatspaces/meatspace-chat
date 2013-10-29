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

  app.post('/add/chat', function (req, res, next) {
    if (req.body.picture) {
      var userId = crypto.createHash('md5').update(req.body.fingerprint + req.connection.remoteAddress).digest('hex');

      if ((userId === req.body.userid && !req.body.apiKey) || nativeClients.indexOf(req.body.apiKey) > -1) {
        publico.addChat(req.body.message.slice(0, 150), {
          ttl: 600000,
          media: req.body.picture,
          fingerprint: userId
        }, function (err, c) {
          if (err) {
            res.status(400);
            res.json({ error: err.toString() });
          } else {
            try {
              io.sockets.emit('message', {
                chat: {
                  key: c.key,
                  value: {
                    fingerprint: userId,
                    created: c.created,
                    media: c.media,
                    ttl: c.ttl,
                    message: c.message
                  }
                }
              });
            } catch (err) {
              console.log('Could not emit message');
            }

            res.json({ status: 'sent!' });
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

  var nativeClients = require('../clients.json');

  io.sockets.on('connection', function (socket) {
    socket.on('message', function (data) {
      if (nativeClients.indexOf(data.apiKey) > -1) {
        publico.addChat(data.message.slice(0, 150), {
          ttl: 600000,
          media: data.picture,
          fingerprint: data.fingerprint
        }, function (err, c) {
          if (err) {
            console.log(err.toString());
          } else {
            try {
              io.sockets.emit('message', {
                chat: {
                  key: c.key,
                  value: {
                    fingerprint: data.fingerprint,
                    created: c.created,
                    media: c.media,
                    ttl: c.ttl,
                    message: c.message
                  }
                }
              });
            } catch (err) {
              console.log(err.toString());
              console.log('Could not emit message');
            }

          }
        });

      } else {
        console.log('Invalid apiKey: ' + data.apiKey);
      }
    });
  });
};
