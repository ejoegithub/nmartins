express             = require 'express'
passport            = require 'passport'
FacebookStrategy    = require('passport-facebook').Strategy
mysql               = require('mysql')
session             = require('express-session')

class App
  start: ->
    @app = express()
    @setupDatabase()
    @setupFacebook()
    @setupRoute()
    @server = @app.listen 3000, =>
      host = @server.address().address
      port = @server.address().port
      console.log "Server started on #{host}:#{port}"

  setupDatabase: ->
    @connection = mysql.createConnection {
      host: '127.0.0.1'
      user: 'root'
      password: 'root'
    }
    @connection.connect (err) =>
      if err
        console.error err.stack
        return
      @connection.query 'USE scoolib'

  setupFacebook: ->
    @app.use session({
        secret: 'scootlib'
        resave: false,
        saveUninitialized: true,
      })
    @app.use passport.initialize()
    @app.use passport.session()
    passport.serializeUser (user, done) =>
      done null, user
    passport.deserializeUser (obj, done) =>
      done null, obj
    passport.use new FacebookStrategy {
        clientID: '937234299643558'
        clientSecret: '46c34a7c632b632d63b78a6bd4952b17'
        callbackURL: "http://192.168.0.30:3000/login/facebook/callback"
      },
      (accessToken, refreshToken, profile, done) =>
        @findOrCreateUser profile, =>
          return done null, profile

  setupRoute: ->
    @app.get '/login/facebook', passport.authenticate('facebook', {scope: ['public_profile', 'email', 'user_birthday']})
    @app.get '/login/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/login/facebook/success',
        failureRedirect: '/login/facebook/fail',
      })
    @app.get '/login/facebook/success', (req, res) ->
      console.log "User #{req.user.displayName} authentified"
      req.session.user = {
        displayName: req.user.displayName
        picture: "https://graph.facebook.com/#{req.user.id}/picture?type=large"
      }
      req.session.save =>
        res.send 'Authentified !'
    @app.get '/login/facebook/fail', (req, res) ->
      res.send 'Failed'
    @app.get '/api/me', (req, res) ->
      res.send JSON.stringify({
          name: req.session.user.displayName
          picture: req.session.user.picture
        })

  findOrCreateUser: (profile, callback) ->
    @connection.query 'INSERT INTO user SET ?',
      {fbid: profile.id, email: profile.emails[0].value, first_name: profile.name.givenName,
      last_name: profile.name.familyName, picture: "https://graph.facebook.com/#{profile.id}/picture?type=large",
      age: profile._json.birthday}, (err, result) =>
        if err
          console.log "Can't save the user : ", err
        callback()

app = new App()
app.start()
