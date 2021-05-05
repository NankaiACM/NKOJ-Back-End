const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const fc = require('../lib/form-check')
const {check_perm, SUPER_ADMIN, GET_CODE_SELF, GET_CODE_ALL, VIEW_OUTPUT_SELF, VIEW_OUTPUT_ALL} = require('../lib/permission')
const {getSolutionStructure, getProblemStructure} = require('../lib/judge')
const language_ext = require('../lib/extension')
async function check_acm_solution(req, ret, ban_status = 0){
  let c_ret = await db.query("SELECT lower(secret_time.during) as start_time, upper(secret_time.during) as end_time FROM secret_time WHERE CURRENT_TIMESTAMP < upper(secret_time.during) ORDER BY lower(secret_time.during) LIMIT 1")
  if(await check_perm(req, SUPER_ADMIN)){
    return
  } else if(c_ret.rows.length > 0){
    let re_l = []
    ret.rows.forEach((solution, index) => {
      solution.score = 666
      // temp disable
      if(solution.user_id != req.session.user){
        solution.time = "810159641"
        solution.memory = "3141592653589"
        solution.code_size = "2357111317"
      }
      if(solution.user_id != req.session.user && solution.when < c_ret.rows[0].end_time && solution.when > c_ret.rows[0].start_time){
        solution.detail = {}
        solution.status_id = 233
        solution.msg_en = "Secret"
        solution.msg_short = "ST"
        solution.msg_cn = "量子纠缠"
        solution.time = "810159641"
        solution.memory = "3141592653589"
        if(ban_status){
          solution.delete = true
        }
      }
      if(ban_status && typeof(solution.delete) == "undefined") re_l.push(solution)
    })
    if(ban_status) ret.rows = re_l
  }
}
async function check_oi_solution(req, ret, ban_status = 0){
  let c_ret = await db.query("SELECT * FROM contest_problems LEFT JOIN contests ON contest_problems.contest_id = contests.contest_id WHERE CURRENT_TIMESTAMP < upper(contests.during) AND contests.rule=\'oi\'")
  if(await check_perm(req, SUPER_ADMIN)){
    return
  } else {
    c_dic = {}
    c_ret.rows.forEach(function(c_p, index){
      c_dic[c_p["problem_id"]] = "OI"
    })
    let re_l = []
    ret.rows.forEach(function(solution, index){
      if(typeof(c_dic[solution.problem_id]) != "undefined"){
        if(solution.status_id != 101){
          solution.detail = {}
          solution.score = 100
          solution.status_id = 233
          solution.msg_en = "Secret"
          solution.msg_short = "ST"
          solution.msg_cn = "量子纠缠"
          solution.time = "810159641"
          solution.memory = "3141592653589"
        }
        if(ban_status){
          solution.delete = true
        }
      }
      if(ban_status && typeof(solution.delete) == "undefined") re_l.push(solution)
    })
    if(ban_status) ret.rows = re_l
  }
}

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

const fcMiddleware = fc.all(['pid/optional', 'uid/optional', 'nickname/optional', 'sid/integer/optional'])

const getSQLClause = (offset, fields) => {
  let i = offset;
  let str = ['1=$' + ++i]
  let arr = [1];
  let { pid, uid, nickname, sid } = fields;
  let ban_status = 0
  pid = Number(pid);
  uid = Number(uid);
  sid = Number(sid);
  if (pid) { str.push('problem_id=$' + ++i); arr.push(pid) }
  if (uid) { str.push('user_id=$' + ++i); arr.push(uid) }
  if (nickname) { str.push('nickname=$' + ++i); arr.push(nickname) }
  if (sid) { str.push('status_id=$' + ++i); arr.push(sid); ban_status = 1 }
  return [`WHERE ${str.join(' AND ')}`, arr, ban_status];
}

router.get('/', fcMiddleware, async (req, res) => {
  'use strict'
  let limit = 20
  let [wClause, sParam, ban_status] = getSQLClause(1, req.fcResult)
  const queryString = `SELECT * FROM user_solutions ${wClause} ORDER BY solution_id DESC LIMIT $1`
  let result = await db.query(queryString, [limit, ...sParam])
  await check_oi_solution(req, result, ban_status)
  await check_acm_solution(req, result, ban_status)
  if (result.rows.length > 0)
    return res.ok(result.rows)
  return res.sendStatus(204)
})

router.get('/:from(\\d+)/:limit(\\d+)?', fcMiddleware, async (req, res) => {
  'use strict'
  let from = Number(req.params.from)
  let limit = Number(req.params.limit || 0)
  if (limit > 50) limit = 50
  if (from < 0 || limit < 0) return next()

  let [wClause, sParam] = getSQLClause(limit ? 2 : 1, req.fcResult)
  const queryString = `SELECT * FROM user_solutions ${wClause} ORDER BY solution_id DESC LIMIT ${limit ? '$1 OFFSET $2' : 'cal_solution_limit($1)'}`
  let result = await db.query(queryString, [...(limit ? [limit, from] : [from]), ...sParam])
  await check_oi_solution(req, result)
  await check_acm_solution(req, result)
  if (result.rows.length > 0)
    return res.ok(result.rows)
  return res.sendStatus(204)
})

router.get('/contest/:sid(\\d+)/:from(\\d+)?', async (req, res) => {
  'use strict'
  // Warning: for tmp limit 10086
  let sid = Number(req.params.sid)
  let from = Number(req.params.from || 0)
   //console.log(sid, from)
  const queryString = 'SELECT * FROM user_solutions WHERE contest_id = $1  AND solution_id > $2 ORDER BY solution_id DESC LIMIT 10086'
  const result = await db.query(queryString, [sid, from])
  await check_oi_solution(req, result)
  await check_acm_solution(req, result)
  // console.dir(result);

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
  await check_oi_solution(req, result)
  await check_acm_solution(req, result)
  if (result.rows.length > 0) {
    const row = result.rows[0]
    const {ipaddr_id, ...ret} = {...row}
    ret.canViewOutput = await check_perm(req, VIEW_OUTPUT_SELF)
    if ((req.session.user === row.user_id && await check_perm(req, GET_CODE_SELF))
      || await check_perm(req, GET_CODE_ALL)
      || ret.shared) {
      const struct = getSolutionStructure(sid)
      ret.compile_info = (row.compile_info || '').replace(/\/var\/www\/data\/.+?main.\w+:? ?/g, `main:`)
      let langExt = language_ext[row.language]
      ret.code = fs.readFileSync(struct.file.code_base + langExt, 'utf8')
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

  const result = await db.query('SELECT user_id, problem_id,status_id FROM user_solutions WHERE solution_id = $1 LIMIT 1', [sid])
  await check_oi_solution(req, result)
  await check_acm_solution(req, result)
  if (result.rows.length > 0) {
    const uid = result.rows[0].user_id
    if (!(req.session.user === uid && await check_perm(req, VIEW_OUTPUT_SELF)) && !await check_perm(req, VIEW_OUTPUT_ALL))
      return res.fail(403)

    const pid = result.rows[0].problem_id

    const ret = {}

    const solution = getSolutionStructure(sid)
    const problem = getProblemStructure(pid)
    ret.status_id=result.rows[0].status_id
    try {
      ret.stdin = await (isFullData ? fs.readFileSync(`${problem.path.data}/${i}.in`, 'utf8') : loadPartialData(`${problem.path.data}/${i}.in`))
      ret.stdout = await (isFullData ? fs.readFileSync(`${problem.path.data}/${i}.out`, 'utf8') : loadPartialData(`${problem.path.data}/${i}.out`))
    } catch (e) {
      return res.fail(404)
    }
    try {
      ret.execout = await (isFullData ? fs.readFileSync(`${solution.path.exec_out}/${i}.execout`, 'utf8') : loadPartialData(`${solution.path.exec_out}/${i}.execout`))
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
    return res.fail(422)
  /**
   * have to check by multiple query to avoid
   * somebody that share a solution submit outside contest page
   * to the problem in a running contest.
  */
  const pid = await db.query('select problem_id from solutions where solution_id = $1 LIMIT 1', [sid])
  if (pid.rows.length === 0) return res.fail(404)
  const endtime = await db.query('select upper(during) as end from contests where contest_id in\
   (select contest_id from contest_problems where problem_id = $1)\
   order by upper(during) desc limit 1;', [pid.rows[0].problem_id])
  if (endtime.rows.length !== 0) {
    const now = new Date()
    const endTime = new Date(endtime.rows[0].end)
    if (now < endTime) { return res.fail(405) }
  }
  
  if (await check_perm(req, GET_CODE_SELF)) {
    const result = await db.query('UPDATE solutions SET shared = $1 WHERE solution_id = $2 AND user_id = $3 AND shared <> $1 RETURNING solution_id, shared'
      , [req.params.type === 'add', sid, req.session.user])
    if (result.rows.length) return res.ok(result.rows[0])
  }

  return res.fail(404)
})

module.exports = router
