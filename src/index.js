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
const session = require('express-session')
const PostgreSqlStore = require('connect-pg-simple')(session)
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const crypto = require('crypto')
const configureRoutes = require('./configureRoutes.js')
const configurePassport = require('./configurePassport.js')
const { version } = require('../package.json')

const app = express()
const origin = CORS_ORIGIN

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
app.use((req, res, next) => {
  res.set('X-Jammer-1-API-Version', `v${version}`)
  next()
})

configurePassport(app, passport)
configureRoutes(app, passport)

app.listen(PORT, () => console.log(`listening on ${PORT} from ${API_ENV}`))
