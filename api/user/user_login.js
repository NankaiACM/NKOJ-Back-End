const router = require('express').Router()

const db = require('../../database/db')
const fc = require('../../lib/form-check')

const redis = require('redis')
const session_client = redis.createClient()
const {DB_SESSION_STORE} = require('../../config/redis')
session_client.select(DB_SESSION_STORE)

const captcha = require('../../lib/captcha')

router.get('/logout', async (req, res) => {
  'use strict'
  delete req.session
  res.ok()
})

router.post('/login', captcha.check('login'), fc.all(['user', 'password']), async (req, res) => {
  'use strict'

  const errArr = [422, [{name: 'name', message: 'might be wrong'}, {
    name: 'password',
    message: 'might be wrong'
  }], 'login failed']

  const query = 'SELECT * FROM users WHERE (lower(nickname) = $1 OR email = $1) AND password = hash_password($2) LIMIT 1'

  let result = await db.query(query, [req.fcResult.user, req.fcResult.password])
  if (result.rows.length > 0)
    db.postLogin(result.rows[0], req, res)
  else
    res.fail(...errArr)
})

router.get('/list/login', async (req, res) => {
  'use strict'
  session_client.hgetall(`session:${req.session.user}`, function (err, ret) {
    res.ok(ret)
  })
})

module.exports = router
