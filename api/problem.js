const router = require('express').Router()
//const redis = require('redis')
//const client = redis.createClient(6379, '192.168.233.128',{})
//const {DB_PROBLEM} = require('../config/redis')
const multer = require('multer')
const path = require('path')
const md5 = require('../lib/md5')
const fs=require('fs')
const db = require('../database/db')
const check = require('../lib/form-check')
const {PROBLEM_DATA_PATH,PROBLEM_PATH}=require('../config/basic')

//client.select(DB_PROBLEM)
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

router.get('/:problemId', async (req, res) => {
  'use strict'
  const problemId = req.params.problemId
  const keys = ['integer']
  const values = [problemId]
  const rules = []
  const form = {}
  let checkResult
  if(checkResult = check(keys, values, rules, form)) return res.fail(1, checkResult)

  const query = "SELECT * FROM problems WHERE problem_id = $1"
  let result = await db.query(query, values)
  if (result) {
    const readDir = path.join('./', PROBLEM_PATH )
    const readPath = path.join(readDir, problemId+'.md')
    res.sendFile(path.resolve(readPath), (err) => {
      if(err) return res.ok(1, err)
    })
  }
  return res.fail(1, 'Unknown problems')
})

router.post('/upload_problem', upload.single('problem'), async (req, res) => {
  'use strict'
  const keys = []
  const values = [req.body.title]
  const rules = ['problem_title']
  const form = {}
  let checkResult
  if(checkResult = check(keys, values, rules, form)) return res.fail(1, checkResult)

  const query = "INSERT INTO problems (title) VALUES ($1) RETURNING problem_id"
  const result = await db.query(query, values)
 if(result.rows.length<1) {
   res.fail(520,'err')
 }
  const problemId=result.rows[0].problem_id;
  fs.rename(req.file.path, PROBLEM_PATH+'/'+problemId+path.extname(file.originalname), (err)=>{
    res.fail(520,err)
  });
  const problem_dir='./'+PROBLEM_DATA_PATH+'/'+problemId
    fs.existsSync(problem_dir) || fs.mkdirSync(problem_dir);
  return res.ok(1,'ok')
})
/*router.post('/update', upload.single('problem'), async (req, res) => {
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
})*/

module.exports = router
