const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const {check_perm, GET_CODE_SELF, GET_CODE_ALL} = require('../lib/permission')
const {getSolutionStructure} = require('../lib/judge')

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

router.get('/detail/:sid(\\d+)?', async (req, res) => {
  'use strict'

  const sid = Number(req.params.sid)

  if (!Number.isInteger(sid))
    res.fail(422)

  const result = await db.query('SELECT * FROM user_solutions WHERE solution_id = $1 LIMIT 1', [sid])
  if (result.rows.length > 0) {
    const row = result.rows[0]
    const {ipaddr_id, ...ret} = {...row}
    if ((req.session.user === row.user_id && check_perm(GET_CODE_SELF)) || check_perm(req, GET_CODE_ALL)) {
      const struct = getSolutionStructure(sid)
      ret.compile_info = fs.readFileSync(struct.file.compile_info, 'utf8')
      // TODO: always cpp...
      ret.code = fs.readFileSync(struct.file.code_base + 'cpp', 'utf8')
    }
    return res.ok(ret)
  }
  return res.fail(404)
})

module.exports = router
