const { Strategy: LocalStrategy } = require('passport-local')

const localStrategyConfig = {
  usernameField: 'username',
  passwordField: 'password'
}

const localStrategyHandler = (username, password, done) => {
  const error = null
  const user = {
    uid: 0,
    uname: 'brn',
    upassword: 'brn',
    validPassword: (p) => p === 'brn'
  }
  if (error) {
    return done(error)
  }
  if (!user) {
    return done(null, false, { message: 'Incorrect username.' })
  }
  if (!user.validPassword(password)) {
    return done(null, false, { message: 'Incorrect password.' })
  }
  return done(null, user)
}

module.exports = (app, passport) => {

  passport.serializeUser((user, done) => {
    return done(null, user.uid)
  })
  
  passport.deserializeUser((id, done) => {
    const error = null
    const user = {
      uid: 0,
      uname: 'brn',
      upassword: 'brn'
    }
    return done(error, user)
  })
  
  passport.use(new LocalStrategy(localStrategyConfig, localStrategyHandler))

  app.use(passport.initialize())
  app.use(passport.session())
  app.use(passport.authenticate('session'))

}
