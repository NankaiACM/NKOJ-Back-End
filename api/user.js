
const router = require('express').Router()
const db = require('../database/db')
const check = require('../lib/check')
const redis = require('redis')
const client = redis.createClient()
const {DB_USER} = require('../config/redis')
const {sendVerificationMail, banEmail} = require('../lib/mail')
const {promisify} = require('util')
const setAsync = promisify(client.set).bind(client)
const getAsync = promisify(client.get).bind(client)
const multer = require('multer')
const path = require('path')
const md5 = require('../lib/md5')
client.select(DB_USER)

const checkLoggedIn = (req, res, next) => {
  'use strict'
  if (!req.session.user)
    return res.fail(401)
  next()
}

router.get('/', checkLoggedIn, async (req, res) => {
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

router.post('/login', async (req, res) => {
  'use strict'

  const keys = ['user', 'password']
  const values = [req.body.user, req.body.password]
  const rules = [{toLower: true}, {}]

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
const {AVATAR_PATH} = require('../config/basic')
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, AVATAR_PATH)
    },
    filename: (req, file, cb) => {
      cb(null, md5(file.fieldname + '-' + Date.now()) + path.extname(file.originalname))
    }
  }),
  fileSize: '2048000',
  files: 1
})

router.post('/update', upload.single('avatar'), checkLoggedIn, async (req, res) => {
  'use strict'

  const keys = ['nickname', 'email', 'gender', 'qq', 'phone', 'real_name', 'school', 'password', 'words']
  const values = [req.body.nickname, req.body.email, req.body.gender, req.body.qq, req.body.phone, req.body.real_name, req.body.school, req.body.password, req.body.words]
  const rule = {allowEmpty: true}
  const rules = [rule, rule, rule, rule, rule, rule, rule, rule, rule]
  const form = {}

  const result = check(keys, values, rules, form)

  if (result) return res.fail(1, result)
  // TODO: check user file and compress the pic to 512*512
  if (req.file) client.set(`avatar:${req.session.user}`, req.file.filename)

  try {
    const result = await db.query(`UPDATE users SET nickname = $1, email = $2, gender = $3, qq = $4, phone = $5, real_name = $6, school = $7, password = $8, words = $9 WHERE user_id = ${req.session.user} RETURNING *`, values)
    if (result.length) return res.ok()
    res.ok('nothing changed')
  } catch (err) {
    res.fatal(520, err)
    throw err
  }
})

router.post('/register', async (req, res) => {
  'use strict'
  const keys = ['nickname', 'password', 'email', 'gender', 'school']
  const values = [req.body.nickname, req.body.password, req.body.email, req.body.gender, req.body.school]
  const form = {}

  let result = check(keys, values, {}, form)
  if (result) return res.fail(1, result)

  form.ecode = req.body.ecode
  const hashed_key = md5(form.email + form.ecode)
  if (await getAsync(hashed_key) !== form.ecode)
    return res.fail(1, {ecode: 'not match'})

  try {
    if (result = await db.checkName(form.nickname))
      return res.fail(1, result)
    if (result = await db.checkEmail(form.email))
      return res.fail(1, result)
    console.log(values)
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
  client.del(hashed_key)

  // TODO: support info update
})

router.get('/verify/:email', async (req, res) => {
  'use strict'
  const email = req.params.email.toLowerCase()
  let result
  if (result = (check(['email'], [req.params.email]) || await db.checkEmail(email))) {
    console.log(result)
    return res.fail(1, result)
  }

  const code = Math.floor(Math.random() * 900000) + 100000
  const key_prefix = md5(email + code)
  const link = `${require('../config/basic').BASE_URL}/api/u/verify/${key_prefix}/${code}`

  result = await setAsync(key_prefix, code, 'NX', 'EX', 600)
  if (!result) return res.fail(500, 'unexpected hash conflict, maybe this email is waiting for verification?')

  sendVerificationMail(email, code, link, (result) => {
    if (result.success) return res.ok(0, {key: key_prefix})
    client.del(key_prefix)
    return res.fail(1, result)
  })
})

router.get('/verify/:key/:code', async (req, res) => {
  'use strict'
  const result = await getAsync(req.params.key)
  if (result !== req.params.code) return res.fail(1, {ecode: 'not match'})
  return res.ok('email verified')
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

router.get('/check/:type/:what', async (req, res, next) => {
  'use strict'
  const type = req.params.type
  const value = req.params.what
  let result
  if (type === 'email') {
    if (!(result = check([type], [value]))) {
      const result = await db.checkEmail(value)
      if (result) res.fail(1, result)
      else res.ok()
    } else res.fail(1, result)
  } else if (type === 'nickname') {
    if (!(result = check([type], [value]))) {
      const result = await db.checkName(value)
      if (result) res.fail(1, result)
      else res.ok()
    } else res.fail(1, result)
  } else next()
})

module.exports = router
