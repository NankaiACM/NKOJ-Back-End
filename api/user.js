const router = require('express').Router()
const db = require('../database/db')
const decrypt = require('../lib/rsa-decrypt')
const check = require('../lib/check')
const sessionStore = require('../lib/session-store')

const regex_email = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/

router.get('/', async (req, res) => {
  'use strict'
  const user = req.session.user
  if (user === undefined) {
    res.fail(401)
    return
  }
  const result = await db.query('SELECT * FROM users WHERE user_id = $1', [user])
  delete result.rows[0].password
  res.ok(result.rows[0])
})

router.get('/logout', async (req, res) => {
  'use strict'
  delete req.session
  res.ok()
})

router.post('/login', async (req, res) => {
  'use strict'

  const keys = ['user', 'password']
  const values = [req.body.user, req.body.password]
  let type = 'undefined'
  const rules = [{toLower: true}
    , {decrypt: true, minLength: 6, maxLength: 16, hash: true}]

  let err = check(keys, values, rules)
  if (err) return res.fail(400, err, 'login failed')

  const errArr = [1, 'wrong username, email or password', 'login failed']

  const query = 'SELECT * FROM users WHERE (lower(nickname) = $1 OR email = $1) AND password = hash_password($2) LIMIT 1'

  let result = await db.query(query, values)
  if (result.rows.length > 0)
    db.postLogin(result.rows[0], req, res)
  else
    res.fail(...errArr)

  // TODO: change hash store to Redis instead.
})

router.post('/register', async (req, res) => {
  'use strict'
  const keys = ['nickname', 'password', 'email', 'gender', 'school']
  const values = [req.body.nickname, req.body.password, req.body.email, req.body.gender, req.body.school]
  const rules = [
    {minLength: 3, maxLength: 20, regex: /^\S+$/, func: n => {return !regex_email.test(n)}}
    , {decrypt: true, minLength: 6, maxLength: 16, hash: true}
    , {type: 'email'}
    , {type: 'integer', min: 0, max: 3}
    , {maxLength: 80}
  ]

  let result = check(keys, values, rules)
  if (result) return res.fail(400, result, 'register failed')

  try {
    if (result = await db.checkName(values[0]))
      return res.fail(400, result, 'register failed')
    if (result = await db.checkEmail(values[2]))
      return res.fail(400, result, 'register failed')

    //TODO: verify email before insert

    const query = 'INSERT INTO users (nickname, password, email, gender, school, ipaddr) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id'
    result = await db.query(query, [...values, req.ip])
  } catch (err) {
    res.fail(520, err)
    throw err
  }
  console.log(result)
  req.session.user = result.rows[0].user_id
  req.session.save()
  res.ok({user_id: req.session.user})

})

router.get('/check/:type/:what', async (req, res, next) => {
  'use strict'
  const type = req.params.type
  const value = req.params.what
  let result
  if (type === 'email') {
    if (!(result = check([type], [value], [{type: 'email'}]))) {
      const result = await db.checkEmail(value)
      if (result) res.fail(1, result)
      else res.ok()
    } else res.fail(1, result)
  } else if (type === 'nickname') {
    if (!(result = check([type], [value], [{
        minLength: 3,
        maxLength: 20,
        regex: /^\S+$/,
        func: n => {return !regex_email.test(n)}
      }]))) {
      const result = await db.checkName(value)
      if (result) res.fail(1, result)
      else res.ok()
    } else res.fail(1, result)
  } else next()
})

module.exports = router
