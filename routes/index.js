'use strict';

module.exports = function (app, io, isLoggedIn) {
  var gravatar = require('gravatar');
  var Publico = require('meatspace-publico');
  var publico = new Publico('none', {
    db: './db',
    limit: 20
  });

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.get('/login', isLoggedIn, function (req, res) {
    res.render('index');
  });

  app.get('/logout', isLoggedIn, function (req, res) {
    res.redirect('/');
  });

  app.get('/dashboard', isLoggedIn, function (req, res) {
    publico.user = req.session.email;
    res.render('dashboard');
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

  app.post('/add/chat', isLoggedIn, function (req, res) {
    publico.addChat(req.body.message, {
      ttl: 600000,
      media: req.body.picture || gravatar.url(req.session.email, { s: 300 })
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
  });
};
