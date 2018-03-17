const router = require('express').Router()

const db = require('../database/db')
const check = require('../lib/form-check')

const {check_perm} = require('../lib/perm-check')

const redis = require('redis')
const session_client = redis.createClient()
const {DB_SESSION_STORE} = require('../config/redis')
session_client.select(DB_SESSION_STORE)

const captcha = require('../lib/captcha')

router.get('/', check_perm(), async (req, res) => {
  'use strict'
  const user = req.session.user
  const result = await db.query('SELECT * FROM users WHERE user_id = $1', [user])
  delete result.rows[0].password
  res.ok(result.rows[0])
})

router.get('/logout', async (req, res) => {
  'use strict'
  delete req.session
  res.ok()
})

router.post('/login', captcha.check('login'), async (req, res) => {
  'use strict'

  const keys = ['user', 'password']
  const values = [req.body.user, req.body.password]
  const rules = [{toLower: true}, {}]

  let err = check(keys, values, rules)
  if (err) return res.fail(400, err)

  const errArr = [1, 'wrong username, email or password', 'login failed']

  const query = 'SELECT * FROM users WHERE (lower(nickname) = $1 OR email = $1) AND password = hash_password($2) LIMIT 1';

  let result = await db.query(query, values)
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
