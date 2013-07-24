'use strict';

module.exports = function(app, isLoggedIn) {
  app.get('/', function(req, res) {
    res.render('index');
  });

  app.get('/dashboard', isLoggedIn, function(req, res) {
    res.render('dashboard');
  });
};
