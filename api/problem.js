const router = require('express').Router()
const redis = require('redis')
const client = redis.createClient()
const {DB_PROBLEM} = require('../config/redis')
const multer = require('multer')
const path = require('path')
const md5 = require('../lib/md5')
client.select(DB_PROBLEM)

router.get('/:problemId', (req, res) => {
  'use strict'
  const problemId = req.params.problemId
  client.get('problem:'+ problemId, (err, filename) =>{
    if(filename){
      const readDir = path.join('./public/', PROBLEM_PATH )
      const readPath = path.join(readDir, filename)
      res.sendFile(path.resolve(readPath), (err) => {
        if(err) res.ok(1, err)
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
