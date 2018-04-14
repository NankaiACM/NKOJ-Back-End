const router = require('express').Router()
const redis = require('redis')
const client = redis.createClient()
const {DB_PROBLEM} = require('../config/redis')
const {PROBLEM_PATH} = require('../config/basic')
const multer = require('multer')
const path = require('path')
const md5 = require('../lib/md5')
const fs = require('fs')
const db = require('../database/db')
client.select(DB_PROBLEM)

router.get('/:pid', async (req, res) => {
  'use strict'
  const problemId = req.params.pid
  const ret = await db.query('SELECT * FROM problems WHERE problem_id = $1', [problemId])
  if (ret.rows.length === 0) return res.fatal(404)
  const tags = await db.query('SELECT problem_tag_assoc.tag_id as id, official, positive as p, negative as n, tag_name as name FROM problem_tag_assoc INNER JOIN problem_tags ON problem_tags.tag_id = problem_tag_assoc.tag_id WHERE problem_id = $1', [problemId])
  ret.rows[0].tags = tags.rows
  client.get('problem:'+ problemId, (err, filename) =>{
    const readPath = path.resolve(PROBLEM_PATH, `${problemId}.md`)
    if (fs.existsSync(readPath)) {
      const content = fs.readFileSync(readPath).toString()
      res.ok(Object.assign(ret.rows[0], {content: content}))
    } else {
      res.fatal(500, 'data not found')
    }
  })
})

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
