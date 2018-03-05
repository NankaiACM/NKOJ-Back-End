const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const check = require('../lib/check')
const redis = require('redis')
const client = redis.createClient(6379, '127.0.0.1', {})
const {DB_PROBLEM} = require('../config/redis')
const {promisify} = require('util')
const setAsync = promisify(client.set).bind(client)
const getAsync = promisify(client.get).bind(client)
const multer = require('multer')
const path = require('path')
const md5 = require('../lib/md5')
client.select(DB_PROBLEM)

router.get('/:problemId', (req, res) => {
  'use strict'
  const problemId = req.params.problemId
  client.get('problem:'+ problemId, (err, filename) =>{
    if(filename){
      const readDir = path.join(__dirname, PROBLEM_PATH )
      const readPath = path.join(readDir, filename)
      res.sendFile(readPath, (err) => {
        if(err) res.fail(1, err)
      })
    } else {
      res.ok(1, {'error': 'No problem!'})
    }
  })
})

const {PROBLEM_PATH} = require('../config/basic')
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, PROBLEM_PATH)
    },
    filename: (req, file, cb) => {
      cb(null, md5(file.fieldname + '-' + Date.now()) + path.extname(file.originalname))
    }
  }),
  fileSize: '2048000',
  files: 1
})

router.post('/update', upload.single('problem'), async (req, res) => {
  'use strict'
  try {
    if (req.file) {
      client.set(`problem:${req.file.originalname}`, req.file.filename)
      res.ok('update successfully! ')
    } else res.ok('no file!')
  } catch (err) {
    res.fatal(520, err)
    throw err
  }
})

module.exports = router
