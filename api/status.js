const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const {check_perm, GET_CODE_SELF, GET_CODE_ALL, VIEW_OUTPUT_SELF, VIEW_OUTPUT_ALL} = require('../lib/permission')
const {getSolutionStructure, getProblemStructure} = require('../lib/judge')

router.get('/', async (req, res) => {
  'use strict'
  let limit = 20
  const queryString = 'SELECT * FROM user_solutions ORDER BY solution_id DESC LIMIT $1'
  const result = await db.query(queryString, [limit])
  if (result.rows.length > 0)
    return res.ok(result.rows)
  return res.sendStatus(204)
})

router.get('/:from(\\d+)/:limit(\\d+)?', async (req, res) => {
  'use strict'
  let from = Number(req.params.from)
  let limit = Number(req.params.limit || 0)
  if (limit > 50) limit = 50

  if (from < 0 || limit < 0) return next()

  const queryString = `SELECT * FROM user_solutions ORDER BY solution_id DESC LIMIT ${limit ? '$1 OFFSET $2' : 'cal_solution_limit($1)'}`
  const result = await db.query(queryString, limit ? [limit, from] : [from])
  if (result.rows.length > 0)
    return res.ok(result.rows)
  return res.sendStatus(204)
})

router.get('/detail/:sid(\\d+)', async (req, res) => {
  'use strict'

  const sid = Number(req.params.sid)

  if (!Number.isInteger(sid))
    res.fail(422)

  const result = await db.query('SELECT * FROM user_solutions WHERE solution_id = $1 LIMIT 1', [sid])
  if (result.rows.length > 0) {
    const row = result.rows[0]
    const {ipaddr_id, ...ret} = {...row}
    ret.canViewOutput = await check_perm(req, VIEW_OUTPUT_SELF)
    if ((req.session.user === row.user_id && await check_perm(req, GET_CODE_SELF)) || await check_perm(req, GET_CODE_ALL)) {
      const struct = getSolutionStructure(sid)
      ret.compile_info = fs.readFileSync(struct.file.compile_info, 'utf8')
      // TODO: always cpp...
      ret.code = fs.readFileSync(struct.file.code_base + 'cpp', 'utf8')
    }
    return res.ok(ret)
  }
  return res.fail(404)
})

router.get('/detail/:sid(\\d+)/case/:i(\\d+)', async (req, res) => {
  'use strict'

  const sid = Number(req.params.sid)
  const i = Number(req.params.i)

  if (!Number.isInteger(sid) || !Number.isInteger(i))
    res.fail(422)

  const result = await db.query('SELECT user_id, problem_id FROM user_solutions WHERE solution_id = $1 LIMIT 1', [sid])
  if (result.rows.length > 0) {
    const uid = result.rows[0].user_id
    if (!(req.session.user === uid && await check_perm(req, VIEW_OUTPUT_SELF)) && !await check_perm(req, VIEW_OUTPUT_ALL))
      return res.fail(403)

    const pid = result.rows[0].problem_id

    const ret = {}

    const solution = getSolutionStructure(sid)
    const problem = getProblemStructure(pid)
    try {
      ret.stdin = fs.readFileSync(`${problem.path.data}/${i}.in`, 'utf8')
      ret.stdout = fs.readFileSync(`${problem.path.data}/${i}.out`, 'utf8')
    } catch (e) {
      return res.fail(404)
    }
    try {
      ret.execout = fs.readFileSync(`${solution.path.exec_out}/${i}.out`, 'utf8')
    } catch (e) {
      ret.execout = null
    }
    return res.ok(ret)
  }
  return res.fail(404)
})

module.exports = router
