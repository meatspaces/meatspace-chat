'use strict';

module.exports = function (app, isLoggedIn) {
  var gravatar = require('gravatar');
  var Parallax = require('meatspace-parallax');
  var parallax = new Parallax('none', {
    db: '../db',
    limit: 20
  });

  app.get('/', function (req, res) {
    if (req.session.email) {
      res.redirect('/dashboard');
    } else {
      res.render('index');
    }
  });

  app.get('/login', isLoggedIn, function (req, res) {
    res.redirect('/dashboard');
  });

  app.get('/logout', isLoggedIn, function (req, res) {

    res.redirect('/');
  });

  app.get('/dashboard', isLoggedIn, function (req, res) {
    parallax.user = req.session.email;
    parallax.friendsLevel = parallax.db.sublevel(parallax.user + '!friends');
    parallax.friendList = parallax.db.sublevel(parallax.user + '!friendlist');
    res.render('dashboard');
  });

  app.get('/get/friends', isLoggedIn, function (req, res) {
    var friends = [];

    var addFriend = function (f, i) {
      var user = f.friends[i].key;

      friends.push({
        user: user,
        avatar: gravatar.url(user, { s: 100 })
      })

      if (friends.length === f.friends.length) {
        res.json({ friends: friends });
      }
    };

    parallax.getFriends(function (err, f) {
      if (err) {
        res.status(400);
        res.json({ error: err.toString() });
      } else {
        var friends = [];

        for (var i = 0; i < f.friends.length; i ++) {
          addFriend(f, i);
        }
      }
    });
  });

  app.get('/get/chats/:user', isLoggedIn, function (req, res) {
    parallax.getChats(req.params.user, false, false, function (err, c) {
      if (err) {
        res.status(400);
        res.json({ error: err.toString() });
      } else {
        res.json({
          chats: c
        });
      }
    });
  });

  app.post('/add/chat', isLoggedIn, function (req, res) {
    parallax.addChat(req.body.friend, req.body.chat, function (err, c) {
      if (err) {
        res.status(400);
        res.json({ error: err.toString() });
      } else {
        res.json({
          user: req.body.friend,
          chat: c
        });
      }
    });
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
