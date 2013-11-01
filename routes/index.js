'use strict';

module.exports = function (app, nconf, io) {
  var crypto = require('crypto');
  var Publico = require('meatspace-publico');
  var nativeClients = require('../clients.json');
  var blacklist = require('../blacklist.json');
  var level = require('level');

  var logger = level(nconf.get('logger'), {
    createIfMissing: true,
    valueEncoding: 'json'
  })

  var publico = new Publico('none', {
    db: './db',
    limit: 20
  });

  app.get('/', function (req, res) {
    logger.put('landing page', {
      ip: req.connection.remoteAddress,
      fingerprint: req.body.fingerprint,
      created: Date.now()
    });
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

  var addChat = function (message, picture, fingerprint, blacklisted, next) {
    publico.addChat(message.slice(0, 150), {
      ttl: 600000,
      media: picture,
      fingerprint: fingerprint
    }, function (err, c) {
      if (err) {
        next(err);
      } else {
        try {
          if (!blacklisted()) {
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
          }

          next(null, 'sent!');
        } catch (err) {
          next(new Error('Could not emit message'));
        }
      }
    });
  };

  app.post('/add/chat', function (req, res, next) {
    var userId = crypto.createHash('md5').update(req.body.fingerprint + req.connection.remoteAddress).digest('hex');

    var blacklisted = function () {
      if (blacklist.indexOf(req.body.fingerprint) > -1 || blacklist.indexOf(req.body.userid) > -1) {
        return true;
      }

      return false;
    };

    if (blacklisted()) {
      logger.put('blacklisted', {
        ip: req.connection.remoteAddress,
        fingerprint: req.body.fingerprint,
        created: Date.now()
      });

      res.status(403);
      res.json({ error: 'access denied' });
    } else {
      if (req.body.picture) {
        if (userId === req.body.userid) {

          addChat(req.body.message, req.body.picture, userId, blacklisted, function (err, status) {
            if (err) {
              res.status(400);
              res.json({ error: err.toString() });
            } else {
              logger.put('posted via web', {
                ip: req.connection.remoteAddress,
                fingerprint: req.body.fingerprint,
                created: Date.now()
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
    }
  });

  io.sockets.on('connection', function (socket) {
    socket.on('message', function (data) {
      if (nativeClients.indexOf(data.apiKey) > -1) {

        addChat(data.message, data.picture, data.fingerprint, function (err) {
          if (err) {
            console.log('error posting ', err.toString());
          } else {
            logger.put('posted via api', {
              ip: req.connection.remoteAddress,
              fingerprint: req.body.fingerprint,
              created: Date.now()
            });
          }
        });
      } else {
        console.log('Invalid apiKey: ', data.apiKey);
      }
    });
  });
};
