const authenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  } else {
    return res.sendStatus(401)
  }
}

module.exports = (app, passport) => {

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

}
