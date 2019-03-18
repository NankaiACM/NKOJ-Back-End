const router = require('express').Router()

const db = require('../../database/db')
const fc = require('../../lib/form-check')

const multer = require('multer')
const path = require('path')

const {AVATAR_PATH} = require('../../config/basic')
const {require_perm} = require('../../lib/permission')
const md5 = require('../../lib/md5')

const {DB_USER} = require('../../config/redis')
const redis = require('../../lib/redis')(DB_USER)

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

router.post('/update',
  require_perm(),
  upload.single('avatar'),
  fc.all(['nickname/optional', 'email/optional', 'gender/optional', 'qq/optional', 'phone', 'real_name', 'school', 'password/optional', 'words']),
  async (req, res) => {
    'use strict'

    const form = req.fcResult

    const ret = {}

    if (req.file) {
      try {
        await sharp(req.file.path).resize(512, 512).max().jpeg({quality: 60}).toFile(`${req.file.path}.sharped.jpg`)
      } catch (err) {
        fs.unlinkSync(req.file.path)
        return res.gen422('avatar', 'invalid picture')
      }
      fs.unlinkSync(req.file.path)
      await redis.setAsync(`avatar:${req.session.user}`, `${req.file.filename}.sharped.jpg`)
      ret.avatar = 'changed'
    } else if (req.fileErr) {
      return res.gen422('avatar', 'invalid type: ' + req.fileErr)
    }

    try {
      const result = await db.query(`UPDATE users SET nickname = $1, email = $2, gender = $3, qq = $4, phone = $5, real_name = $6, school = $7, password = $8, words = $9 WHERE user_id = ${req.session.user} 
    RETURNING nickname, email, gender, qq, phone, real_name, school, password, words`
        , [form.nickname, form.email, form.gender, form.qq, form.phone, form.real_name, form.school, form.password, form.words])
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

  
router.post('/nkpc', require_perm(), fc.all(['real_name', 'student_number', 'gender', 'institute', 'qq', 'phone']), async(req, res) => {
    console.log(req.session.user)
    const form = req.fcResult
    let ret = {}
    await db.query(`INSERT INTO users_nkpc(user_id) VALUES(${req.session.user})`)
    try{
      const result = await db.query(`UPDATE users_nkpc SET real_name = $1, student_number = $2, gender = $3, institute = $4, qq = $5, phone = $6 WHERE user_id = ${req.session.user}
        RETURNING real_name, student_number, gender, institute, qq, phone`, [form.real_name, form.student_number, form.gender, form.institute, form.qq, form.phone])
      if(result.rows.length){
        Object.keys(result.rows[0]).forEach((k) => {
          if (result.rows[0][k]) ret[k] = result.rows[0][k]
        })
        return res.ok(ret)
      } else return res.fail(500, 'database error')
    } catch(err){
      res.fatal(520, err)
      throw err
    }
})
module.exports = router
