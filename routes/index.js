'use strict';

module.exports = function (app, io, isLoggedIn) {
  var Publico = require('meatspace-publico');
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

  app.post('/add/chat', function (req, res, next) {
    if (req.body.picture) {
      publico.addChat(req.body.message.slice(0, 150), {
        ttl: 600000,
        media: req.body.picture
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
      res.status(400);
      res.json({ error: 'you need webrtc' });
    }
  });
};
