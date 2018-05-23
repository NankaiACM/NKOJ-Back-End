const router = require('express').Router()
const fs = require('fs')
const db = require('../database/db')
const ws = require('ws')
const {DATA_BASE} = require('../config/basic')
const {require_perm} = require('../lib/permission')
const fc = require('../lib/form-check')
const {getSolutionStruct, unlinkTempFolder} = require('../lib/judge')

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

  let langString = 'cpp'
  const result = await db.query('INSERT INTO solutions (user_id, problem_id, language, ipaddr_id, status_id) VALUES ($1, $2, $3, get_ipaddr_id($4), 1) RETURNING solution_id', [user, problem, lang, ip])

  const solution_id = result.rows[0].solution_id
  const struct = getSolutionStruct(solution_id)

  fs.writeFileSync(`${struct.path.solution}/main.${langString}`, code)

  const socket = new ws('ws://127.0.0.1:8888')
  socket.on('message', function (msg) {
    console.log(msg)
  })
  socket.on('open', function open () {
    socket.send([DATA_BASE, solution_id, problem, langString, time_limit, memory_limit, cases, special_judge, detail_judge].join('\n'))
  })
  socket.on('close', async function close () {
    const data = fs.readFileSync(struct.file.data)
    const result = fs.readFileSync(struct.file.result).split('\n')[0]
    const time = fs.readFileSync(struct.file.time).split('\n')[0]
    const memory = fs.readFileSync(struct.file.memory).split('\n')[0]
    const compile_info = fs.readFileSync(struct.file.compile_info)

    await db.query('UPDATE solutions SET status_id = $1, `time` = $2, `memory` = $3 WHERE solution_id = $4', [result, time, memory, solution_id])

    if (data !== '') res.ok({solution_id, time, memory, result, compile_info})
    else res.fail(500, 'seems something wrong, contact admin...')

    unlinkTempFolder(solution_id)
  })
})

module.exports = router
