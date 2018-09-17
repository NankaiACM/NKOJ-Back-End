const router = require('express').Router()
const db = require('../database/index')
const fs = require('fs')
const {check_perm, GET_CODE_SELF, GET_CODE_ALL, VIEW_OUTPUT_SELF, VIEW_OUTPUT_ALL} = require('../lib/permission')
const {getSolutionStructure, getProblemStructure} = require('../lib/judge')

function loadPartialData (path) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(path, {
      start: 0,
      end: 1000,
      autoClose: true,
      encoding: 'utf8'
    })
    let res = ''
    stream.on('data', data => res += data)
    stream.on('end', () => {
      let arr = res.split('\n')
      if (arr.length > 20) arr = [...arr.slice(0, 20), '<...>']
      resolve(arr.join('\n'))
    })
    stream.on('error', (err) => reject(err))
  })
}


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
    if ((req.session.user === row.user_id && await check_perm(req, GET_CODE_SELF))
      || await check_perm(req, GET_CODE_ALL)
      || ret.shared) {
      const struct = getSolutionStructure(sid)
      try {
        ret.compile_info = fs.readFileSync(struct.file.compile_info, 'utf8')
      } catch (e) {
        ret.compile_info = '评测机内核没有正常运行... 请通知馆里猿0v0'
      }
      ret.compile_info = ret.compile_info.replace(/\/var\/www\/data\//g, `f:\\${sid}\\`)
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
  const isFullData = req.query.all

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
      ret.stdin = await (isFullData ? fs.readFileSync(`${problem.path.data}/${i}.in`, 'utf8') : loadPartialData(`${problem.path.data}/${i}.in`))
      ret.stdout = await (isFullData ? fs.readFileSync(`${problem.path.data}/${i}.out`, 'utf8') : loadPartialData(`${problem.path.data}/${i}.out`))
    } catch (e) {
      return res.fail(404)
    }
    try {
      ret.execout = await (isFullData ? fs.readFileSync(`${solution.path.exec_out}/${i}.out`, 'utf8') : loadPartialData(`${solution.path.exec_out}/${i}.out`))
    } catch (e) {
      ret.execout = null
    }
    return res.ok(ret)
  }
  return res.fail(404)
})

router.get('/share/:type(add|remove)/:sid(\\d+)', async (req, res) => {
  'use strict'

  const sid = Number(req.params.sid)

  if (!Number.isInteger(sid))
    res.fail(422)

  if (await check_perm(req, GET_CODE_SELF)) {
    const result = await db.query('UPDATE solutions SET shared = $1 WHERE solution_id = $2 AND user_id = $3 AND shared <> $1 RETURNING solution_id, shared'
      , [req.params.type === 'add', sid, req.session.user])
    if (result.rows.length) return res.ok(result.rows[0])
  }

  return res.fail(404)
})

module.exports = router
