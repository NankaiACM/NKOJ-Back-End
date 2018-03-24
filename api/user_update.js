const router = require('express').Router()

const db = require('../database/db')
const check = require('../lib/form-check')

const multer = require('multer')
const path = require('path')

const {AVATAR_PATH} = require('../config/basic')
const {check_perm} = require('../lib/perm-check')
const md5 = require('../lib/md5')

const {DB_USER} = require('../config/redis')
const redis = require('../lib/redis-util')(DB_USER)

const sharp = require('sharp')
const fs = require('fs')

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
  files: 1,
  fileFilter: (req, file, cb) => {
    const mimetype = file.mimetype
    if (!mimetype.startsWith('image/')) {
      req.fileErr = mimetype
      cb(null, false)
    }
    else cb(null, true)
  }
})

router.post('/update', upload.single('avatar'), check_perm(), async (req, res) => {
  'use strict'

  const keys = ['nickname', 'email', 'gender', 'qq', 'phone', 'real_name', 'school', 'password', 'words']
  const values = [req.body.nickname, req.body.email, req.body.gender, req.body.qq, req.body.phone, req.body.real_name, req.body.school, req.body.password, req.body.words]
  const rule_allow_nonexist = {nonexist: 'allow'}
  const rule_allow_all = {nonexist: 'allow', empty: 'allow'}
  const rules = [rule_allow_nonexist, rule_allow_nonexist, rule_allow_nonexist, rule_allow_all, rule_allow_all, rule_allow_all, rule_allow_all, rule_allow_nonexist, rule_allow_all]
  const form = {}

  const result = check(keys, values, rules, form)

  if (result) return res.fail(1, result)

  const ret = {}

  // TODO: permission check
  if (req.file) {
    try {
      await sharp(req.file.path).resize(512, 512).max().jpeg({quality: 60}).toFile(`${req.file.path}.sharped.jpg`)
    } catch (err) {
      fs.unlinkSync(req.file.path)
      return res.fail(400, 'invalid picture')
    }
    fs.unlinkSync(req.file.path)
    await redis.setAsync(`avatar:${req.session.user}`, `${req.file.filename}.sharped.jpg`)
    ret.avatar = 'changed'
  } else if (req.fileErr) {
    return res.fail(400, `file rejected as it is ${req.fileErr}`)
  }

  try {
    const result = await db.query(`UPDATE users SET nickname = $1, email = $2, gender = $3, qq = $4, phone = $5, real_name = $6, school = $7, password = $8, words = $9 WHERE user_id = ${req.session.user} 
    RETURNING nickname, email, gender, qq, phone, real_name, school, password, words`, values)
    if (result.rows.length) {
      Object.keys(result.rows[0]).forEach((k) => {
        if (result.rows[0][k]) ret[k] = 'changed'
      })
      return res.ok(ret)
    }
    else return res.fail(500, 'user id not found or no values could be changed')
  } catch (err) {
    res.fatal(520, err)
    throw err
  }
})

module.exports = router
