const {
  NODE_ENV,
  API_ENV,
  VUE_APP_REST_API,
  POSTGRES_CONN_STR,
  EXPRESS_SESSION_SECRET,
  CORS_ORIGIN,
  PORT,
  API_PORT,
  PGSSLMODE,
  DB_SECRET_KEY,
  ARCHAEON_PLATFORM_GMAIL_PASSWORD
} = process.env

console.clear()
console.log('using')
console.log({
  NODE_ENV,
  API_ENV,
  VUE_APP_REST_API,
  POSTGRES_CONN_STR,
  EXPRESS_SESSION_SECRET,
  CORS_ORIGIN,
  PORT,
  API_PORT,
  PGSSLMODE,
  DB_SECRET_KEY,
  ARCHAEON_PLATFORM_GMAIL_PASSWORD
})

const path = require('path')
const express = require('express')
const passport = require('passport')
const session = require('express-session')
const PostgreSqlStore = require('connect-pg-simple')(session)
const pg = require('pg')
const getDb = require('./getDb.js')
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const configureRoutes = require('./configureRoutes.js')
const configurePassport = require('./configurePassport.js')
const { version } = require('../package.json')

const app = express()
const origin = CORS_ORIGIN

const postgresStoreConfig = () => {
  const conString = `${POSTGRES_CONN_STR}?sslmode=no-verify`
  return {
    conString,
    ssl: { rejectUnauthorized: false }
  }
}

const expressSessionCookie = (app) => {
  const cookie = {
    expires: 1000 * 60 * 60 * 24 * 3 // 3 days
  }
  if (NODE_ENV === 'prod') {
    app.set('trust proxy', 1)
    return {
      ...cookie,
      secure: true,
      sameSite: 'none'
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
  cookie: expressSessionCookie(app)
}))
app.use((req, res, next) => {
  res.set('X-Jammer-1-API-Version', `v${version}`)
  next()
})

const db = getDb(`${POSTGRES_CONN_STR}?sslmode=no-verify`)
configurePassport(app, passport, db)
configureRoutes(app, passport, db)

app.listen(API_PORT || PORT, () => console.log(`listening on ${API_PORT || PORT} from ${API_ENV}`))
