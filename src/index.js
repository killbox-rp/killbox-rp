const {
  NODE_ENV,
  POSTGRES_CONN_STR,
  EXPRESS_SESSION_SECRET,
  CORS_ORIGIN,
  API_ENV,
  PORT
} = process.env

console.clear()
console.log('using')
console.log({
  NODE_ENV,
  POSTGRES_CONN_STR,
  EXPRESS_SESSION_SECRET,
  CORS_ORIGIN,
  API_ENV,
  PORT
})

const path = require('path')
const express = require('express')
const passport = require('passport')
const { Strategy: LocalStrategy } = require('passport-local')
const session = require('express-session')
const PostgreSqlStore = require('connect-pg-simple')(session)
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const crypto = require('crypto')
const { version } = require('../package.json')

const app = express()
const origin = CORS_ORIGIN

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

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, (username, password, done) => {
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
}))

const authenticated = (req, res, next) => {
  console.log('req.isAuthenticated()', req.isAuthenticated())
  if (req.isAuthenticated()) {
    return next()
  } else {
    return res.sendStatus(401)
  }
}

const postgresStoreConfig = () => {
  const ssl = NODE_ENV === 'dev' ? {
    require: true,
    rejectUnauthorized: false
  } : {}
  const conString = NODE_ENV === 'dev' ? `${POSTGRES_CONN_STR}?sslmode=no-verify` : `${POSTGRES_CONN_STR}`
  return {
    conString
  }
}

const expressSessionCookie = () => {
  const cookie = {
    expires: 1000 * 60 * 60 * 24 * 3 // 3 days
  }
  if (NODE_ENV === 'prod') {
    app.set('trust proxy', 1)
    return {
      ...cookie,
      secure: true
    }
  }
  return { ...cookie }
}

app.use(morgan('dev'))
app.use(cors({ origin, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(EXPRESS_SESSION_SECRET))
app.use(session({
  secret: EXPRESS_SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: new PostgreSqlStore(postgresStoreConfig()),
  cookie: expressSessionCookie()
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(passport.authenticate('session'))
app.use((req, res, next) => {
  res.set('X-Jammer-1-API-Version', `v${version}`)
  next()
})

app.get('/', async (req, res) => {
  const message = 'hi'
  res.json({ message })
})

app.post('/api/v2/authenticate', passport.authenticate('local', { failureRedirect: '/api/v2/unauthorized', failureMessage: true }), async (req, res) => {
  const { user } = req
  return res.redirect(`/api/v2/users/${user.uname}`)
})

app.get('/api/v2/users/:uname', authenticated, async (req, res) => {
  return res.json({ message: 'yo' })
})

app.get('/api/v2/unauthorized', async (req, res) => {
  return res.json({ message: 'unauthorized' })
})

app.put('/api/v2/unauthenticate', async (req, res) => {
  req.logout()
  return res.json({ message: 'unauthorized' })
})

app.listen(PORT, () => console.log(`listening on ${PORT} from ${API_ENV}`))
