// Module dependencies.
module.exports = function(app, configurations, express) {
  var clientSessions = require('client-sessions');
  var nconf = require('nconf');
  var maxAge = 24 * 60 * 60 * 1000 * 28;
  var nativeClients = require('./clients.json');
  var csrf = express.csrf();
  var hood = require('hood');

  nconf.argv().env().file({ file: 'local.json' });

  // Configuration

  var clientBypassCSRF = function (req, res, next) {
    if (req.body.apiKey && nativeClients.indexOf(req.body.apiKey) > -1) {
      next();
    } else {
      csrf(req, res, next);
    }
  };

  app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    if (!process.env.NODE_ENV) {
      app.use(express.logger('dev'));
    }
    app.use(express.static(__dirname + '/public'));
    app.use(clientSessions({
      cookieName: nconf.get('session_cookie'),
      secret: nconf.get('session_secret'),
      duration: maxAge, // 4 weeks
      cookie: {
        httpOnly: true,
        maxAge: maxAge
      }
    }));
    app.use(clientBypassCSRF);
    app.use(hood.csp({
      policy: {
        'default-src': ['self', 'unsafe-inline', 'ws://'],
        'img-src': ['self', 'data:', 'unsafe-inline']
      }
    }));
    app.use(function (req, res, next) {
      res.locals.session = req.session;
      if (!req.body.apiKey) {
        res.locals.csrf = req.csrfToken();
      } else {
        res.locals.csrf = false;
      }
      if (!process.env.NODE_ENV) {
        res.locals.debug = true;
      } else {
        res.locals.debug = false;
      }
      res.locals.analytics = nconf.get('analytics');
      res.locals.analyticsHost = nconf.get('analyticsHost');
      next();
    });
    app.locals.pretty = true;
    app.use(app.router);
    app.use(function (req, res, next) {
      res.status(404);
      res.render('404', { url: req.url, layout: false });
      return;
    });
    app.use(function (req, res, next) {
      res.status(403);
      res.render('403', { url: req.url, layout: false });
      return;
    });
  });

  app.configure('development, test', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('prod', function() {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('500', { error: err, layout: false });
    });
    app.use(express.errorHandler());
  });

  return app;
};
