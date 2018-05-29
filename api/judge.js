const router = require('express').Router()
const fs = require('fs')
const db = require('../database/db')
const ws = require('ws')
const {DATA_BASE} = require('../config/basic')
const {require_perm, REJUDGE_ALL} = require('../lib/permission')
const fc = require('../lib/form-check')
const {getSolutionStructure, unlinkTempFolder} = require('../lib/judge')

router.post('/', require_perm(), fc.all(['pid', 'lang', 'code']), async (req, res) => {
  'use strict'
  const form = req.fcResult
  const problem = form.pid
  const lang = form.lang
  const code = form.code
  const user = req.session.user
  const ip = req.ip

  let ret = await db.query('SELECT time_limit, memory_limit, cases, special_judge::integer, detail_judge::integer FROM problems WHERE problem_id = $1', [problem])
  if (ret.rows.length === 0)
    return res.fail(404, 'problem not found')

  const row = ret.rows[0]
  const time_limit = row.time_limit
  const memory_limit = row.memory_limit
  const cases = row.cases
  const special_judge = row.special_judge
  const detail_judge = row.detail_judge

  // TODO: always cpp...
  let langString = 'cpp'
  const result = await db.query('INSERT INTO solutions (user_id, problem_id, language, ipaddr_id, status_id) VALUES ($1, $2, $3, get_ipaddr_id($4), 100) RETURNING solution_id', [user, problem, lang, ip])

  const solution_id = result.rows[0].solution_id

  res.ok({solution_id})

  const struct = getSolutionStructure(solution_id)

  fs.writeFileSync(`${struct.path.solution}/main.${langString}`, code)

  const socket = new ws('ws://127.0.0.1:8888')
  socket.on('error', function (err) {
    throw err
  })
  socket.on('message', function (msg) {
    console.log(msg)
  })
  socket.on('open', function open () {
    socket.send([DATA_BASE, solution_id, problem, langString, time_limit, memory_limit, cases, special_judge, detail_judge].join('\n'))
  })
  socket.on('close', async function close () {
    try {
      const result = fs.readFileSync(struct.file.result, 'utf8').split('\n')[0]
      const time = fs.readFileSync(struct.file.time, 'utf8').split('\n')[0]
      const memory = fs.readFileSync(struct.file.memory, 'utf8').split('\n')[0]
      // const compile_info = fs.readFileSync(struct.file.compile_info, 'utf8')
      const code_length = Buffer.byteLength(code, 'utf8')

      await db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, code_size = $4 WHERE solution_id = $5', [result, time, memory, code_length, solution_id])
      // if (result !== '') res.ok({solution_id, time, memory, result, compile_info})
      // else res.fail(500, 'seems something wrong, contact admin...')
    } catch (e) {
      // TODO: DEV
      // res.fail(500, e)
    }
    unlinkTempFolder(solution_id)
  })
})

router.get('/rejudge/:sid', require_perm(REJUDGE_ALL), async (req, res) => {
  const sid = Number(req.params.sid) || undefined
  if (!Number.isInteger(sid)) return res.fail(422)
  const struct = getSolutionStructure(sid)
  const result = await db.query('UPDATE solutions SET status_id = 100 WHERE solution_id = $1 RETURNING problem_id', [sid])
  if (!result.rows.length) return res.fail(404)

  const pid = result.rows[0].problem_id
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
    try {
      const code_length = fs.statSync(`${struct.file.code_base}${langString}`).size
      const result = fs.readFileSync(struct.file.result, 'utf8').split('\n')[0]
      const time = fs.readFileSync(struct.file.time, 'utf8').split('\n')[0]
      const memory = fs.readFileSync(struct.file.memory, 'utf8').split('\n')[0]
      const detail = fs.readFileSync(struct.file.detail, 'utf8')
      const compile_info = fs.readFileSync(struct.file.compile_info, 'utf8')

      await db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, code_size = $4 WHERE solution_id = $5', [result, time, memory, code_length, sid])
      if (result !== '') res.ok({solution_id: sid, time, memory, result, detail, compile_info, code_length})
      else res.fail(500, 'seems something wrong, contact admin...')
    } catch (e) {
      res.fail(500, e.stack || e)
    }
    unlinkTempFolder(sid)
  })

})

module.exports = router
