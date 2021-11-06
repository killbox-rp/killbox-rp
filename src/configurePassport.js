const {
  NODE_ENV,
  API_ENV,
  POSTGRES_CONN_STR,
  EXPRESS_SESSION_SECRET,
  CORS_ORIGIN,
  PORT,
  API_PORT,
  PGSSLMODE,
  DB_SECRET_KEY
} = process.env

const { Strategy: LocalStrategy } = require('passport-local')

module.exports = (app, passport, db) => {

  const localStrategyConfig = {
    usernameField: 'username',
    passwordField: 'password'
  }
  
  const localStrategyHandler = async (username, password, done) => {
    try {
      const query = 'select uid, uname, uborn, uconfirmed from users where uname = $1 and upassword = crypt($2, upassword)'
      const params = [username, password]
      const result = await db.query(query, params)
      if (result.rows.length < 1) {
        return done(null, false)
      } else {
        return done(null, { ...result.rows[0], id: result.rows[0].uid })
      }
    } catch (error) {
      console.log(error)
      return done(error, false)
    }
  }

  passport.serializeUser((user, done) => {
    return done(null, user.uid)
  })
  
  passport.deserializeUser(async (id, done) => {
    try {
      const query = `
        select uid, uname, uborn,
          convert_from(decrypt(nakey::bytea, '${DB_SECRET_KEY}', 'bf'), 'utf-8') as nakey,
          convert_from(decrypt(dakey::bytea, '${DB_SECRET_KEY}', 'bf'), 'utf-8') as dakey, 
          uemail,
          uconfirmed
        from users where uid = $1
        `
      const params = [id]
      const result = await db.query(query, params)
      const user = { ...result.rows[0], id: result.rows[0].uid }
      return done(null, user)
    } catch (error) {
      return (error, null)
    }
  })
  
  passport.use(new LocalStrategy(localStrategyConfig, localStrategyHandler))

  app.use(passport.initialize())
  app.use(passport.session())
  app.use(passport.authenticate('session'))

}
