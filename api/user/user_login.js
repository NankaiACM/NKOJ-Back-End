const router = require('express').Router()

const db = require('../../database/db')
//const check = require('../lib/form-check')
const {matchedData} = require('express-validator/filter')
const {validationResult} = require('express-validator/check')
const check = require('../../lib/form-check')
const {check_perm} = require('../../lib/perm-check')

const redis = require('redis')
const session_client = redis.createClient()
const {DB_SESSION_STORE} = require('../../config/redis')
session_client.select(DB_SESSION_STORE)

const captcha = require('../../lib/captcha')

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

router.post('/login', captcha.check('login'), [check.user, check.password], async (req, res) => {
  'use strict'

  /*const keys = ['user', 'password']
  const values = [req.body.user, req.body.password]
  const rules = [{toLower: true}, {}]

  let err = check(keys, values, rules)
  if (err) return res.fail(400, err)*/

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.fail(1, errors.array())
    return
  }
  const checkres = matchedData(req)
  const values = [checkres.user, checkres.password]

  const errArr = [1, [{name: 'name', message: 'might be wrong'}, {
    name: 'password',
    message: 'might be wrong'
  }], 'login failed']

  const query = 'SELECT * FROM users WHERE (lower(nickname) = $1 OR email = $1) AND password = hash_password($2) LIMIT 1'

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