// Generated by CoffeeScript 1.8.0
(function() {
  var App, FacebookStrategy, app, express, mysql, passport, session;

  express = require('express');

  passport = require('passport');

  FacebookStrategy = require('passport-facebook').Strategy;

  mysql = require('mysql');

  session = require('express-session');

  App = (function() {
    function App() {}

    App.prototype.start = function() {
      this.app = express();
      this.setupDatabase();
      this.setupFacebook();
      this.setupRoute();
      return this.server = this.app.listen(3000, (function(_this) {
        return function() {
          var host, port;
          host = _this.server.address().address;
          port = _this.server.address().port;
          return console.log("Server started on " + host + ":" + port);
        };
      })(this));
    };

    App.prototype.setupDatabase = function() {
      this.connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'root'
      });
      return this.connection.connect((function(_this) {
        return function(err) {
          if (err) {
            console.error(err.stack);
            return;
          }
          return _this.connection.query('USE scoolib');
        };
      })(this));
    };

    App.prototype.setupFacebook = function() {
      this.app.use(session({
        secret: 'scootlib',
        resave: false,
        saveUninitialized: true
      }));
      this.app.use(passport.initialize());
      this.app.use(passport.session());
      passport.serializeUser((function(_this) {
        return function(user, done) {
          return done(null, user);
        };
      })(this));
      passport.deserializeUser((function(_this) {
        return function(obj, done) {
          return done(null, obj);
        };
      })(this));
      return passport.use(new FacebookStrategy({
        clientID: '937234299643558',
        clientSecret: '46c34a7c632b632d63b78a6bd4952b17',
        callbackURL: "http://192.168.0.30:3000/login/facebook/callback"
      }, (function(_this) {
        return function(accessToken, refreshToken, profile, done) {
          return _this.findOrCreateUser(profile, function() {
            return done(null, profile);
          });
        };
      })(this)));
    };

    App.prototype.setupRoute = function() {
      this.app.get('/login/facebook', passport.authenticate('facebook', {
        scope: ['public_profile', 'email', 'user_birthday']
      }));
      this.app.get('/login/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/login/facebook/success',
        failureRedirect: '/login/facebook/fail'
      }));
      this.app.get('/login/facebook/success', function(req, res) {
        console.log("User " + req.user.displayName + " authentified");
        req.session.user = {
          displayName: req.user.displayName,
          picture: "https://graph.facebook.com/" + req.user.id + "/picture?type=large"
        };
        return req.session.save((function(_this) {
          return function() {
            return res.send('Authentified !');
          };
        })(this));
      });
      this.app.get('/login/facebook/fail', function(req, res) {
        return res.send('Failed');
      });
      return this.app.get('/api/me', function(req, res) {
        return res.send(JSON.stringify({
          name: req.session.user.displayName,
          picture: req.session.user.picture
        }));
      });
    };

    App.prototype.findOrCreateUser = function(profile, callback) {
      return this.connection.query('INSERT INTO user SET ?', {
        fbid: profile.id,
        email: profile.emails[0].value,
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        picture: "https://graph.facebook.com/" + profile.id + "/picture?type=large",
        age: profile._json.birthday
      }, (function(_this) {
        return function(err, result) {
          if (err) {
            console.log("Can't save the user : ", err);
          }
          return callback();
        };
      })(this));
    };

    return App;

  })();

  app = new App();

  app.start();

}).call(this);
