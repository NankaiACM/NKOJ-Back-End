const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const {CONTEST_PATH} = require('../../config/basic')
const redis = require('redis')
const {DB_CONTEST} = require('../../config/redis')
const client = redis.createClient()
//const check = require('../lib/form-check')
const { matchedData} = require('express-validator/filter');
const {validationResult}=require('express-validator/check')
const check=require('../../lib/form-check')
client.select(DB_CONTEST)

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(path.join('../public', CONTEST_PATH)))
    },
    filename: (req, file, cb) => {
      cb(null, 'contest_' + file.fieldname + '_' + req.id + '.md')
    }
  }),
  fileSize: '2048000',
  files: 1,
  fileFilter: async (req, file, cb) => {
    const queryString = 'SELECT MAX(contest_id) AS maxid FROM contests'
    let result = await db.query(queryString, {})
    if(req.body.id <= result.rows[0].maxid) {
      req.idErr = 'Id conflict'
      cb(null, false)
    } else if(path.extname(file.originalname) !== '.md'){
      req.fileErr = 'Not md file!'
      cb(null, false)
    }
    else cb(null, true)
  }
})

router.post('/', upload.fields({name : 'rule', maxCount: 1}, {name: 'about', maxCount: 1}),[check.id,check.role_title,
  check.role_description,check.problems,check.start,check.end], async (req, res) => {

  if(req.idErr){ res.fail(1, req.idErr) }
  if(req.fileErr) { res.fail(2, req.fileErr) }

  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }
  const checkres = matchedData(req);
  const id = checkres.id
  client.set('contest_rule:' + id, 'contest_rule_' + id + '.md')
  client.set('contest_about:' + id, 'contest_about_' + id + '.md')
  const title = checkres.title
  const start = checkres.start
  const end = checkres.end
  const description = checkres.discription
  const problems = checkres.problems
  const values = [title, description]

  const queryString = 'INSERT INTO contests (title, during, description, problems) VALUES ($1, $2, $3, $4)'
  const during = '[' + start + ',' + end + ']'
  db.query(queryString, [title, during, description, problems]).then( suc => {
    res.ok('Success Add!')
  }, err => {
    res.fail(1, err)
  })

})

module.exports = router