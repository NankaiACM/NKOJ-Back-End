const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const {CONTEST_PATH, TEMP_PATH} = require('../../config/basic')
const fc = require('../../lib/form-check')
const db = require('../../database/db')
const fs = require('fs')

// 添加一个新的竞赛


const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TEMP_PATH)
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now().toString(36)}${Math.floor(Math.random() * 100).toString(36)}${path.extname(file.originalname)}`)
    }
  })
})

router.post('/', upload.single('file')
  , fc.all(['title', 'description', 'start', 'end', 'perm', 'private', 'rule'])
  , async (req, res) => {

    const form = req.fcResult
    const during = '[' + form.start + ',' + form.end + ']'

    try {
      const ret = await db.query(
        'INSERT INTO contests (title, during, description, perm, private, rule) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
        , [form.title, during, form.description, form.perm, form.private, form.rule]
      )
      const cid = ret.rows[0].contest_id
      let desc
      if (req.file) {
        const file = req.file
        fs.renameSync(`${file.destination}/${file.filename}`, `${CONTEST_PATH}/${cid}.md`)
        desc = fs.readFileSync(`${CONTEST_PATH}/${cid}.md`, 'utf8')
      }

      return res.ok({file: desc, ...ret.rows[0]})

    } catch (e) {
      if (req.file) {
        fs.unlinkSync(`${req.file.destination}/${req.file.filename}`)
      }
      return res.fail(500, e.stack || e)
    }
  })

// 获得已有竞赛信息
router.get('/:cid', fc.all(['cid']), async (req, res) => {
  const cid = req.fcResult.cid
  // 基本信息
  const basic = await db.query('SELECT * FROM user_contests WHERE contest_id = $1', [cid])
  if (basic.rows.length === 0) return res.fail(404)

  // 人员信息
  const participants = await db.query('SELECT user_id, nickname FROM contest_users NATURAL JOIN user_info NATURAL JOIN user_nick WHERE contest_id = $1', [cid])

  // 描述文件
  let file
  try {
    file = fs.readFileSync(`${CONTEST_PATH}/${cid}.md`, 'utf8')
  } catch (e) {

  }
  res.ok({...basic.rows[0], participants: participants.rows, file})
})

router.get('/remove/:cid', fc.all(['cid']), async (req, res) => {
    const cid = req.fcResult.cid
    // 查看基本信息
    const basic = await db.query('SELECT * FROM user_contests WHERE contest_id = $1', [cid])
    if (basic.rows.length === 0) return res.fail(404)
    // 删除数据库
    const participants = await db.query('DELETE FROM contests WHERE contest_id = $1', [cid])

    // 删除描述文件
    let file
    try {
        file = fs.unlinkSync(`${CONTEST_PATH}/${cid}.md`, 'utf8')
    } catch (e) {

    }
    res.ok('remove successfully')
})


// 添加 / 删除竞赛用户

router.get('/:cid/user/:type(add|remove)/:uid', fc.all(['cid']), async (req, res) => {
  const form = req.fcResult
  const debug = {debug: {type: req.params.type, ...form}}
  let ret
  // DEBUG:
  ret = await db.query('SELECT private FROM contests WHERE contest_id = $1', [form.cid])
  if (!ret.rows.length) return res.fail(404)
  else if (!ret.rows[0].private) return res.fail(422, debug, 'operation not supported on non-private contest')

  let successCount = 0
  const uid = req.params.uid.split(',')
  switch (req.params.type) {
    case 'add':
      if (!uid.every(u => Number.isInteger(Number(u)))) return res.gen422('uid', 'some of them is not integer')
      for (let u of uid) {
        ret = await db.query('INSERT INTO contest_users(contest_id, user_id) VALUES($1, $2) ON CONFLICT DO NOTHING', [form.cid, u])
        successCount += ret.rowCount
      }
      break
    case 'remove':
      if (uid[0] === 'all') {
        ret = await db.query('DELETE FROM contest_users WHERE contest_id = $1', [form.cid])
        successCount += ret.rowCount
      } else {
        if (!uid.every(u => Number.isInteger(Number(u)))) return res.gen422('uid', 'some of them is not integer')
        for (let u of uid) {
          ret = await db.query('DELETE FROM contest_users WHERE contest_id = $1 AND user_id = $2', [form.cid, u])
          successCount += ret.rowCount
        }
      }
      break
  }

  if (successCount) return res.ok({success: successCount})
  return res.fail(404, debug, 'operation succeeded but nothing changed')
})

// 添加 / 删除竞赛题目
router.get('/:cid/problem/:type(add|remove)/:pid', fc.all(['cid', 'pid']), async (req, res) => {
  const form = req.fcResult
  let ret
  switch (req.params.type) {
    case 'add':
      ret = await db.query('UPDATE problems SET contest_id = $1 WHERE problem_id = $2 AND contest_id IS NULL', [form.cid, form.pid])
      if (ret.rowCount)
        await db.query('INSERT INTO contest_problems(problem_id, contest_id) VALUES ($1, $2)', [form.pid, form.cid])
      break
    case 'remove':
      ret = await db.query('UPDATE problems SET contest_id = NULL WHERE problem_id = $1 AND contest_id = $2', [form.pid, form.cid])
      if (ret.rowCount)
        await db.query('DELETE FROM contest_problems WHERE problem_id = $1 AND contest_id = $2', [form.pid, form.cid])
      break
  }
  if (ret.rowCount) return res.ok(ret.rows[0])
  return res.fail(404, {debug: {type: req.params.type, ...form}})
})

// 修改竞赛
router.post('/:cid'
  , upload.single('file')
  , fc.all(['title/optional', 'description/optional', 'start/optional', 'end/optional', 'perm/optional', 'private', 'rule'])
  , async (req, res) => {

    const cid = Number(req.params.cid)
    const basic = await db.query('SELECT * FROM user_contests WHERE contest_id = $1', [cid])
    if (basic.rows.length === 0) {
      if (req.file) {
        fs.unlinkSync(`${req.file.destination}/${req.file.filename}`)
      }
      return res.fail(404)
    }

    if (req.file) {
      const file = req.file
      fs.renameSync(`${file.destination}/${file.filename}`, `${CONTEST_PATH}/${cid}.md`)
    }
    let file
    try {
      file = fs.readFileSync(`${CONTEST_PATH}/${cid}.md`, 'utf8')
    } catch (e) {

    }

    const {start, end, ...form} = req.fcResult
    form.during = '[' + start + ',' + end + ']'
    const query = []
    const value = []
    let c = 1
    for (let i in form) {
      if (!form.hasOwnProperty(i)) continue
      query.push(`"${i}" = $${c}`)
      value.push(form[i])
      c++
    }
    if (query.length !== 0) {
      const result =
        await db.query(`UPDATE contests SET ${query.join(', ')} WHERE contest_id = $${c} RETURNING *`, [...value, cid])
      if (result.rows.length)
        return res.ok({file, ...result.rows[0]})
    }
    return res.fail(422)
  })

//查看NKPC报名情况
router.get('/nkpc/members', async (req, res) => {
    const result = await db.query('SELECT * FROM users_nkpc')
    res.ok(result.rows)
})

router.post('/nkpc/secret_time', async(req, res) => {
    const during = '[' + req.body.start_time + ',' + req.body.end_time + ']'
    const result = await db.query(`INSERT INTO secret_time (during) VALUES($1)`, [during])
    res.ok(result)
})

//去重
router.get('/nkpc/distinct', async(req, res) => {
    const result = await db.query('SELECT DISTINCT * FROM users_nkpc')
    await db.query('DELETE FROM users_nkpc where user_id != 0')
    console.log(result.rows.length)
    result.rows.forEach( (key) => {
      db.query('INSERT INTO users_nkpc (user_id, real_name, student_number, gender, institute, qq, phone) VALUES($1, $2, $3, $4, $5, $6, $7)',
      [key.user_id, key.real_name, key.student_number, key.gender, key.institute, key.qq, key.phone])
    })
})


router.post('/nkpc/standings', async(req, res) => {
  const cid = req.body.cid
  const nameList = req.body.nameList
  let starMap = {}
  for (let i = 0; i < nameList.length; i++) {
    starMap[nameList[i].nickname]=nameList[i].school
  }
  let ret = await db.query(`SELECT contest_id, lower(during) as begin FROM contests WHERE contest_id = $1`, [cid])
  if (ret.rows.length === 0) return res.fail(404, 'contest not found')
  const beginTime = new Date(ret.rows[0].begin)
  
  ret = await db.query('SELECT problem_id FROM contest_problems WHERE contest_id = $1 ORDER BY problem_id ASC', [cid])
  let data = { problem_count: ret.rows.length}
  let problemMap = {}
  for (let i = 0, len = ret.rows.length; i < len; i++) {
    problemMap[ret.rows[i].problem_id] = String(i + 1)
  }
  
  ret = await db.query('SELECT user_id, nickname, school FROM users WHERE user_id IN\
    (SELECT user_id FROM contest_users WHERE contest_id=$1)', [cid])
  let participants = {}
  for (let i = 0, len = ret.rows.length; i < len; i++) {
    const nickname = ret.rows[i].nickname
    const isStar = nickname in starMap
    const school = isStar ? starMap[nickname] : ret.rows[i].school
    participants[String(ret.rows[i].user_id)] = {
      name: nickname, college: school, is_exclude: isStar
    }
  }
  data['users'] = participants
  
  ret = await db.query('SELECT solution_id, user_id, problem_id, score, "when" FROM solutions WHERE contest_id=$1', [cid])
  let solutions = {}
  for (let i = 0, len = ret.rows.length; i < len ; i++) {
    const item = ret.rows[i]
    solutions[String(item.solution_id)] = {
      user_id: String(item.user_id),
      problem_index: problemMap[item.problem_id],
      verdict: item.score === 100.0 ? 'AC' : 'WA',
      submitted_seconds: parseInt((new Date(item.when) - beginTime) / 1000)
    }
  }
  data['solutions'] = solutions
  res.ok(data)
})

module.exports = router
