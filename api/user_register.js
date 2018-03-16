const router = require('express').Router()

const check = require('../lib/form-check')
const db = require('../database/db')

const md5 = require('../lib/md5')
const {DB_USER} = require('../config/redis')
const redis = require('../lib/redis_util')(DB_USER)
const {sendVerificationMail, banEmail} = require('../lib/mail')

router.get('/verify/:email', async (req, res) => {
  'use strict'
  const email = req.params.email

  let result
  if (result = check(['email'], [email]))
    return res.fail(400, result)

  if (result = await db.checkEmail(email))
    return res.fail(1, result)

  const code = Math.floor(Math.random() * 900000) + 100000
  const key_prefix = md5(email + code)
  const link = `${require('../config/basic').BASE_URL}/api/u/verify/${key_prefix}/${code}`

  result = await redis.setAsync(key_prefix, code, 'NX', 'EX', 600)
  if (!result) return res.fail(500, 'unexpected hash conflict')

  sendVerificationMail(email, code, link, (result) => {
    if (result.success) return res.ok({key: key_prefix})
    redis.del(key_prefix)
    return res.fail(1, result)
  })
})

router.get('/verify/:key/:code', async (req, res) => {
  'use strict'
  const result = await redis.getAsync(req.params.key)
  if (result !== req.params.code) return res.fail(1, {ecode: 'not match'})
  return res.ok('email verified')
})

// noinspection JSUnresolvedFunction
router.post('/register', async (req, res) => {
  'use strict'
  const keys = ['nickname', 'password', 'email', 'gender', 'school']
  const values = [req.body.nickname, req.body.password, req.body.email, req.body.gender,req.body.school]
  const form = {}

  let result = check(keys, values, {}, form)
  if (result) return res.fail(400, result)

  if (result = await db.checkName(form.nickname))
    return res.fail(1, result)

  form.ecode = req.body.ecode
  const hashed_key = md5(form.email + form.ecode)
  if (await redis.getAsync(hashed_key) !== form.ecode)
    return res.fail(1, {ecode: 'not match'})

  try {
    if (result = await db.checkEmail(form.email))
      return res.fail(1, result)
    const query = 'INSERT INTO users (nickname, password, email, gender, school, ipaddr) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id'
    result = await db.query(query, [...values, req.ip])
  } catch (err) {
    res.fail(520, err)
    throw err
  }
  req.session.user = result.rows[0].user_id
  req.session.save()
  res.ok({user_id: req.session.user})
  redis.del(hashed_key)
})

router.get('/unsubscribe/:hash/:email', async (req, res) => {
  'use strict'
  const email = Buffer.from(req.params.email, 'base64').toString()
  const hash = req.params.hash
  const cb = result => {
    if (result.success) return res.ok(result)
    return res.fail(1, result)
  }
  banEmail(hash, email, false, cb)
})

module.exports = router
