const router = require('express').Router()
//const check = require('../lib/form-check')
const {matchedData} = require('express-validator/filter')
const {validationResult} = require('express-validator/check')
const check = require('../../lib/form-check')
const db = require('../../database/db')

const md5 = require('../../lib/md5')
const captcha = require('../../lib/captcha')
const {limit, require_limit, apply_limit} = require('../../lib/rate-limit')

const {DB_USER} = require('../../config/redis')
const redis = require('../../lib/redis-utils')(DB_USER)
const {sendVerificationMail, banEmail} = require('../../lib/mail')
const regex_email = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/

router.get('/verify/:email', captcha.check('sendmail'), check.email, limit('sendmail'), async (req, res) => {
  'use strict'
  /*const email = req.params.email

  let result
  if (result = check(['email'], [email]))
    return res.fail(400, result)*/
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.fail(1, errors.array())
    return
  }
  const checkres = matchedData(req)
  const email = checkres.email
  let result
  if (result = await db.checkEmail(email))
    return res.fail(1, result)

  const code = Math.floor(Math.random() * 900000) + 100000
  const key = md5(email + code)
  const link = `${require('../../config/basic').BASE_URL}/api/u/verify/${key}/${code}`

  result = await redis.setAsync(key, code, 'NX', 'EX', 600)
  if (!result) return res.fail(500, 'unexpected hash conflict')

  // return res.ok({key: key, code: code})

  // noinspection UnreachableCodeJS
  sendVerificationMail(email, code, link, (result) => {
    if (result.success) {
      apply_limit('sendmail', req)
      return res.ok({key: key})
    }
    redis.del(key)
    return res.fail(1, result)
  })
})

router.get('/verify/:key/:code', async (req, res, next) => {
  'use strict'
  const key = req.params.key
  const code = req.params.code
  const ret = await redis.getAsync(key)
  if (regex_email.test(code)) {
    req.email_code = ret
    return next()
  }
  req.session.ecode = code
  if (ret !== code) return res.fail(1, [{name: 'ecode', message: 'not match'}])
  return res.ok('email verified')
})

router.get('/verify/:key/:email', limit('sendmail'), async (req, res) => {
  'use strict'
  const key = req.params.key
  const email = req.params.email
  const code = req.email_code

  if (key === md5(email + code)) {
    const link = `${require('../../config/basic').BASE_URL}/api/u/verify/${key}/${code}`

    //return res.ok({key: key, code: code})

    // noinspection UnreachableCodeJS
    return sendVerificationMail(email, code, link, (result) => {
      console.log(email, result)
      if (result.success) return res.ok({key: key})
      return res.fail(1, result)
    })
  }
  return res.fail(1, [{name: 'email', message: 'not match'}])
})

// noinspection JSUnresolvedFunction
router.post('/register', [check.nickname, check.password, check.email, check.school, check.gender], async (req, res) => {
  'use strict'
  /*const keys = ['nickname', 'password', 'email', 'gender', 'school']
  const values = [req.body.nickname, req.body.password, req.body.email, req.body.gender, req.body.school]
  const form = {}

  let result = check(keys, values, {}, form)
  if (result) return res.fail(400, result)*/
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.fail(1, errors.array())
    return
  }
  const checkres = matchedData(req)
  const values = [checkres.nickname, checkres.password, checkres.email, checkres.gender, checkres.school]
  const form = checkres
  let result
  if (result = await db.checkName(form.nickname))
    return res.fail(1, result)

  form.ecode = req.body.ecode || req.session.ecode
  const hashed_key = md5(form.email + form.ecode)
  if (await redis.getAsync(hashed_key) !== form.ecode)
    return res.fail(1, [{name: 'ecode', message: 'not match'}])

  try {
    if (result = await db.checkEmail(form.email))
      return res.fail(1, result)
    const query = 'INSERT INTO users (nickname, password, email, gender, school, ipaddr) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
    result = await db.query(query, [...values, req.ip])
  } catch (err) {
    res.fail(520, err)
    throw err
  }
  req.session.user = result.rows[0].user_id
  req.session.save()
  res.ok(result.rows[0])
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
