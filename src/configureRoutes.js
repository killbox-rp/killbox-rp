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

const crypto = require('crypto')
const nodemailer = require('nodemailer')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage, preservePath: true })

const authenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  } else {
    return res.sendStatus(401)
  }
}

const getEmailText = (username, email, password, key) => {
  return `Hello, ${username}.

Here is your account information:

  Username: ${username}
  E-mail: ${email}
  Password: ${password}

Use the following link to confirm your e-mail, and begin using the platform.

  https://${VUE_APP_REST_API}/confirm-email/${key}

Good luck.

You're recieving this e-mail because somebody signed up for archaeon, a platform for dayz nitrado public slot server modding.`
}

module.exports = (app, passport, db) => {

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'archaeonplatform@gmail.com',
      pass: `${ARCHAEON_PLATFORM_GMAIL_PASSWORD}`
    }
  })

  const simpleQuery = async (req, res, query = '', params = [], cb = () => {}, compress = false, dilute = false) => {
    try {
      const result = await db.query(query, params)
      if (compress === true) {
        const results = result.rows.reduce((a,c) => {
          const { servers } = { servers: [], ...a }
          const { sid, sname, sactive, sborn, schannel, sportlist, ...rest } = c
          return {
            ...rest,
            servers: [
              ...servers,
              { sid, sname, sactive, sborn, schannel, sportlist }
            ]
          }
        }, [])
        if (result.rows.length > 0) {
          const response = [results]
          res.send(response)
        } else {
          cb()
        }
      } else {
        res.send(result.rows)
      }
      if (dilute === false) {
        cb(null)
        res.end()
      }
    } catch (error) {
      console.log(error)
      res.status(500)
      res.send(error)
      res.end()
      cb(e)
    }
  }

  app.get('/', async (req, res) => {
    const message = 'hi'
    res.json({ message })
  })
  
  app.post('/api/v2/authenticate', passport.authenticate('local', { failureRedirect: '/api/v2/unauthorized', failureMessage: true }), async (req, res) => {
    const { user } = req
    return res.redirect(`/api/v2/users/${user.uname}`)
  })
  
  app.get('/api/v2/users/:uname', db.connected(), authenticated, async (req, res) => {
    return res.json({ message: 'yo' })
  })

  app.put('/api/v2/users/:username', db.connected(), authenticated, upload.none(), (req, res) => {
    const { params, body, user } = req
    const { nitradoApiKey, discordApiKey } = body
    simpleQuery(req, res, `update users set nakey = encrypt($1, '${DB_SECRET_KEY}', 'bf'), dakey = encrypt($3, '${DB_SECRET_KEY}', 'bf') where uname = $2`, [nitradoApiKey, user.uname, discordApiKey])
  })

  app.get('/api/v2/me', db.connected(), authenticated, (req, res) => {
    const { user } = req
    const { uname } = user
    res.redirect(`/api/v2/users/${uname}`)
  })

  app.post('/api/v2/register', db.connected(), upload.none(), async (req, res) => {
    try {
      const { body } = req
      const { email, username, password } = body
      // first check see if already exists
      await new Promise(async (resolve, reject) => {
        const query = `select uname from users where uname = $1`
        const parameters = [username]
        const result = await db.query(query, parameters)
        if (result.rows.length === 0) {
          resolve(result)
        } else {
          reject(result)
        }
      })
      const key = await new Promise((resolve, reject) => {
        const key = crypto.randomBytes(48, (error, buffer) => {
          const key = buffer.toString('hex')
          resolve(key)
        })
      })
      // will error if exists, else continue and insert
      const result = await new Promise(async (resolve, reject) => {
        try {
          const query = `
            insert into users (uname, uemail, upassword, uconfirmkey, nakey, dakey)
            values (
              $1,
              $2,
              crypt($3, gen_salt('bf')),
              $4,
              encrypt(bytea '', '${DB_SECRET_KEY}', 'bf'),
              encrypt(bytea '', '${DB_SECRET_KEY}', 'bf')
            )
            returning uname, uborn
          `
          console.log('insert into user', username, email, password)
          const parameters = [username, email, password, key]
          const result = await db.query(query, parameters)
          console.log('result', result.rows.length)
          if (result.rows.length > 0) {
            resolve(result)
          } else {
            reject(result)
          }
        } catch (error) {
          reject(error)
        }
      })
      res.status(201)
      res.send(result.rows)
      res.end()
      // SEND E-MAIL
      const mailOptions = {
        from: 'Archaeon Platform <no-reply@archaeon.io>',
        to: 'braungoodson@gmail.com', // email
        priority: 'high',
        subject: 'Welcome to Archaeon. Confirm your e-mail within.',
        text: getEmailText(username, email, password, key)
      }
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error)
        } else {
          console.log(info)
        }
      })
    } catch (error) {
      console.log(error)
      res.status(401)
      res.send(error)
      res.end()
    }
  })

  app.post('/api/v2/confirm-email/:key', db.connected(), authenticated, async (req, res) => {
    const { params } = req
    const { key } = params
    try {
      const query = `
        update users set uconfirmkey = null, uconfirmed = 1
        where uconfirmkey = $1
        returning uname, uborn
      `
      const parameters = [key]
      const result = await db.query(query, parameters)
      if (result.rows.length > 0) {
        res.status(201)
        res.send(result.rows)
        res.end()
      } else {
        console.log(result)
        res.status(500)
        res.end()
      }
    } catch (error) {
      console.log(error)
      res.status(401)
      res.send(error)
      res.end()
    }
  })
  
  app.get('/api/v2/unauthorized', async (req, res) => {
    return res.json({ message: 'unauthorized' })
  })
  
  app.put('/api/v2/unauthenticate', authenticated, async (req, res) => {
    req.logout()
    return res.json({ message: 'unauthorized' })
  })

  app.get('/api/v2/ping', async (req, res) => {
    res.send('pong')
  })
  
  app.get('/api/v2/traffic', db.connected(), async (req, res) => {
    try {
      const traffic = await db.query('select * from traffic')
      res.send(traffic.rows)
      res.end()
    } catch (error) {
      console.log(error)
      res.status(500)
      res.send(error)
      res.end()
    }
  })
  
  app.post('/api/v2/traffic', db.connected(), async (req, res) => {
    try {
      const { hostname, ip } = req
      const query = 'insert into traffic (thostname, tip) values ($1, $2)'
      const parameters = [hostname, ip]
      await db.query(query, parameters)
      res.status(201)
      res.end()
    } catch (error) {
      //console.log(error)
      res.status(500)
      res.send(error)
      res.end()
    }
  })

}
