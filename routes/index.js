'use strict';

module.exports = function(app, isLoggedIn) {
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
};
