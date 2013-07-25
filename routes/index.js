'use strict';

module.exports = function (app, isLoggedIn) {
  var gravatar = require('gravatar');
  var Parallax = require('meatspace-parallax');
  var parallax = new Parallax({
    db: '../db',
    limit: 100
  });

  var parallax;

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.get('/login', isLoggedIn, function (req, res) {
    parallax = new Parallax(req.session.email, {
      db: '../db',
      limit: 20
    });

    res.redirect('/dashboard');
  });

  app.get('/dashboard', isLoggedIn, function (req, res) {
    res.render('dashboard');
  });

  app.get('/get/friends', isLoggedIn, function (req, res) {
    parallax.getFriends(function (err, f) {
      if (err) {
        res.status(400);
        res.json({ error: err.toString() });
      } else {
        var friends = [];

        for (var i = 0; i < f.friends.length; i ++) {
          friends.push({
            avatar: gravatar.url(f.friends[i].key, { s: 100 })
          })

          if (friends.length === f.friends.length) {
            res.json({ friends: friends });
          }
        }
      }
    });
  });

  app.post('/add/chat', isLoggedIn, function (req, res) {

  });

  app.post('/add/friend', isLoggedIn, function (req, res) {
    parallax.getOrAddFriend(req.body.friend, function (err, f) {
      if (err) {
        res.status(400);
        res.json({ error: err.toString() });
      } else {
        f.avatar = gravatar.url(f.user, { s: 100 });
        res.json({ friend: f });
      }
    });
  });
};
