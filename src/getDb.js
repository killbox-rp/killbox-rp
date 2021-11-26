const {
  NODE_ENV,
  API_ENV,
  POSTGRES_CONN_STR,
  EXPRESS_SESSION_SECRET,
  CORS_ORIGIN,
  PORT,
  API_PORT,
  PGSSLMODE
} = process.env

const pg = require('pg')
const pgConStr = require('pg-connection-string')
const { Pool } = pg

const getDb = (connectionString) => {
  const poolConfig = { connectionString, ssl: { rejectUnauthorized: false }}
  console.log(poolConfig)
  const dbClient = new Pool(poolConfig)
  const db = {
    $connected: false,
    query (query, params) {
      return dbClient.query(query, params)
    },
    async connect () {
      await dbClient.connect()
      this.$connected = true
    },
    connected () {
      return (req, res, next) => {
        if (this.$connected) {
          next()
        } else {
          res.status(500)
          res.end()
        }
      }
    },
    getClient () {
      return dbClient
    }
  }
  try {
    db.connect()
  } catch (error) {
    console.log('could not connect to db', error)
  }
  return db
}

module.exports = getDb
