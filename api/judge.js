const router = require('express').Router()
const fs = require('fs')
const db = require('../database/index')
const ws = require('ws')
const {DATA_BASE} = require('../config/basic')
const {require_perm, check_perm, REJUDGE_ALL, SUPER_ADMIN} = require('../lib/permission')
const fc = require('../lib/form-check')
const {getSolutionStructure, unlinkTempFolder} = require('../lib/judge')

router.post('/', require_perm(), fc.all(['pid', 'lang', 'code']), async (req, res, next) => {
  'use strict'
  const form = req.fcResult
  const pid = form.pid
  const lang = form.lang
  const code = form.code
  const uid = req.session.user
  const ip = req.ip

  const ret = await db.query(
    'SELECT time_limit, memory_limit, cases, special_judge::integer, detail_judge::integer, contest_id FROM problems WHERE problem_id = $1', [pid])
  if (ret.rows.length === 0) return res.fail(404, 'problem not found')

  const row = ret.rows[0]
  const time_limit = row.time_limit
  const memory_limit = row.memory_limit
  const cases = row.cases
  const special_judge = row.special_judge
  const detail_judge = row.detail_judge
  let cid = row.contest_id

  let contest_status = undefined

  if (cid) {
    const ret = await db.query(
      'SELECT current_timestamp > LOWER(during) AS is_started, current_timestamp > UPPER(during) AS is_ended, private, row_to_json(perm) FROM contests WHERE contest_id = $1', [cid]
    )
    const contest = ret.rows[0]

    if (contest.is_ended) {
      cid = undefined
      db.query('UPDATE problems SET contest_id = NULL WHERE problem_id = $1', [pid]).then(() => {})
    } else if (await check_perm(req, SUPER_ADMIN)) {
      cid = undefined
    } else if (contest.is_started) {
      if (contest.private) {
        contest_status = await db.query('SELECT * FROM contest_users WHERE contest_id = $1 AND user_id = $2', [cid, uid])
        if (!contest_status.rows.length)
          return res.fail(403)
        else contest_status = contest_status.rows[0].status
        console.log('contest_status', contest_status)
      }
      else {
        await db.query('INSERT INTO contest_users(contest_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [cid, uid])
      }
    }
  }

  // TODO: always cpp...
  let langString = 'cpp'
  const result = await db.query(
    'INSERT INTO solutions (user_id, problem_id, language, ipaddr_id, status_id, contest_id) VALUES ($1, $2, $3, get_ipaddr_id($4), 100, $5) RETURNING solution_id'
    , [uid, pid, lang, ip, cid]
  )

  const solution_id = result.rows[0].solution_id

  res.ok({solution_id})

  const struct = getSolutionStructure(solution_id)

  fs.writeFileSync(`${struct.path.solution}/main.${langString}`, code)
  const code_length = Buffer.byteLength(code, 'utf8')

  const socket = new ws('ws://127.0.0.1:8888')
  socket.on('error', function (err) {
    throw err
  })
  socket.on('message', function (msg) {
    console.log(msg)
  })
  socket.on('open', function open () {
    socket.send([DATA_BASE, solution_id, pid, langString, time_limit, memory_limit, cases, special_judge, detail_judge].join('\n'))
  })
  socket.on('close', async function close () {
    try {
      const result = fs.readFileSync(struct.file.result, 'utf8').split('\n')[0]
      const time = fs.readFileSync(struct.file.time, 'utf8').split('\n')[0]
      const memory = fs.readFileSync(struct.file.memory, 'utf8').split('\n')[0]
      // const compile_info = fs.readFileSync(struct.file.compile_info, 'utf8')

      const ret = await db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, code_size = $4 WHERE solution_id = $5 RETURNING "when"', [result, time, memory, code_length, solution_id])

      if (cid) {
        // TODO: call util function to recount data to contest_users
      }

    } catch (e) {
      db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, code_size = $4 WHERE solution_id = $5 RETURNING "when"', [101, 0, 0, code_length, solution_id]).then(()=>{}).catch((e)=>{console.error(e)})
      next(e)
    }
    unlinkTempFolder(solution_id)
  })
})

router.get('/rejudge/:sid', require_perm(REJUDGE_ALL), async (req, res, next) => {
  const sid = Number(req.params.sid) || undefined
  if (!Number.isInteger(sid)) return res.fail(422)
  const struct = getSolutionStructure(sid)
  const result = await db.query('UPDATE solutions SET status_id = 100 WHERE solution_id = $1 RETURNING *', [sid])
  if (!result.rows.length) return res.fail(404)

  const pid = result.rows[0].problem_id
  const cid = result.rows[0].contest_id

  let problem_info = await db.query('SELECT time_limit, memory_limit, cases, special_judge::integer, detail_judge::integer FROM problems WHERE problem_id = $1', [pid])
  if (!problem_info.rows) return res.fail(500, 'problem is not available?')

  // TODO:
  const langString = 'cpp'

  const row = problem_info.rows[0]
  const time_limit = row.time_limit
  const memory_limit = row.memory_limit
  const cases = row.cases
  const special_judge = row.special_judge
  const detail_judge = row.detail_judge

  const socket = new ws('ws://127.0.0.1:8888')
  socket.on('error', function (err) {
    throw err
  })
  socket.on('message', function (msg) {
    console.log(msg)
  })
  socket.on('open', function open () {
    socket.send([DATA_BASE, sid, pid, langString, time_limit, memory_limit, cases, special_judge, detail_judge].join('\n'))
  })
  socket.on('close', async function close () {
    let code_length
    try {
      code_length = fs.statSync(`${struct.file.code_base}${langString}`).size
    } catch (e) {
      return next(e)
    }
    try {
      const result = fs.readFileSync(struct.file.result, 'utf8').split('\n')[0]
      const time = fs.readFileSync(struct.file.time, 'utf8').split('\n')[0]
      const memory = fs.readFileSync(struct.file.memory, 'utf8').split('\n')[0]
      let detail
      try {
        detail = fs.readFileSync(struct.file.detail, 'utf8')
      } catch (e) {
        detail = 'not found'
      }
      const compile_info = fs.readFileSync(struct.file.compile_info, 'utf8')

      const ret = await db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, code_size = $4 WHERE solution_id = $5', [result, time, memory, code_length, sid])
      res.ok({solution_id: sid, time, memory, result, detail, compile_info, code_length, contest_id: cid})

      if (cid) {
        // TODO: call util function to recount data to contest_users
      }
    } catch (e) {
      db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, code_size = $4 WHERE solution_id = $5', [101, 0, 0, code_length, sid])
      next(e)
    }
    unlinkTempFolder(sid)
  })
})

module.exports = router
