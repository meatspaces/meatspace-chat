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

  var blacklisted = function (fingerprint, userid) {
    if (blacklist.indexOf(fingerprint) > -1 || blacklist.indexOf(userid) > -1) {
      return true;
    }

    return false;
  };

  app.get('/', function (req, res) {
    var currDate = Date.now();
    logger.put('landing-page!' + currDate, {
      ip: req.connection.remoteAddress,
      fingerprint: req.body.fingerprint,
      created: currDate
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

  var addChat = function (message, picture, fingerprint, userId, next) {
    if (!blacklisted(fingerprint, userId)) {
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
    } else {
      next(new Error('access denied'));
    }
  };

  app.post('/add/chat', function (req, res, next) {
    var userId = crypto.createHash('md5').update(req.body.fingerprint + req.connection.remoteAddress).digest('hex');

    if (blacklisted()) {
      var currDate = Date.now();
      logger.put('blacklisted!' + currDate, {
        ip: req.connection.remoteAddress,
        fingerprint: req.body.fingerprint,
        created: currDate
      });

      res.status(403);
      res.json({ error: 'access denied' });
    } else {
      if (req.body.picture) {
        if (userId === req.body.userid) {
          addChat(req.body.message, req.body.picture, req.body.fingerprint, userId, function (err, status) {
            if (err) {
              res.status(400);
              res.json({ error: err.toString() });
            } else {
              var currDate = Date.now();
              logger.put('web!' +currDate, {
                ip: req.connection.remoteAddress,
                fingerprint: req.body.fingerprint,
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
    }
  });

  io.sockets.on('connection', function (socket) {
    socket.on('message', function (data) {
      if (nativeClients.indexOf(data.apiKey) > -1) {

        addChat(data.message, data.picture, data.fingerprint, '', function (err) {
          if (err) {
            console.log('error posting ', err.toString());
          } else {
            var currDate = Date.now();
            logger.put('api!' + currDate, {
              ip: req.connection.remoteAddress,
              fingerprint: req.body.fingerprint,
              created: currDate
            });
          }
        });
      } else {
        console.log('Invalid apiKey: ', data.apiKey);
      }
    });
  });
};
