const router = require('express').Router()
const fs = require('fs')
const db = require('../database/db')
const {require_perm, check_perm, SUPER_ADMIN} = require('../lib/permission')
const fc = require('../lib/form-check')
const {getSolutionStructure, unlinkTempFolder} = require('../lib/judge')
const { spawn } = require('../lib/spawn')
const language_ext = require('../lib/extension')

router.post('/', require_perm(), fc.all(['pid', 'lang', 'code']), async (req, res, next) => {
  'use strict'
  const form = req.fcResult
  const { pid, lang, code } = form
  const uid = req.session.user
  const ip = req.ip

  const ret = await db.query(
    'SELECT time_limit, memory_limit, cases, special_judge::integer, detail_judge::integer, contest_id FROM problems WHERE problem_id = $1', [pid])
  if (ret.rows.length === 0) return res.fail(404, 'problem not found')
  if (language_ext[lang] === null) return res.fail(404, 'language not supported')

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
      }
      else {
        await db.query('INSERT INTO contest_users(contest_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [cid, uid])
      }
    }
  }

  let langExt = language_ext[lang]
  let langName = language_ext[langExt]

  const result = await db.query(
    'INSERT INTO solutions (user_id, problem_id, language, ipaddr_id, status_id, contest_id) VALUES ($1, $2, $3, get_ipaddr_id($4), 100, $5) RETURNING solution_id'
    , [uid, pid, lang, ip, cid]
  )

  const solution_id = result.rows[0].solution_id

  res.ok({solution_id})

  const struct = getSolutionStructure(solution_id)

  const filename = `main.${langExt}`;

  fs.writeFileSync(`${struct.path.solution}/main.${langExt}`, code)
  const code_length = Buffer.byteLength(code, 'utf8')

  const config = {
    "sid": solution_id,
    "filename": filename,
    "lang": langName,
    "pid": pid,
    "max_time": time_limit,
    "max_time_total": 30000,
    "max_memory": memory_limit,
    "max_output": 10000000,
    "max_thread": 4,
    "continue_on": detail_judge ? true : ["accepted", "presentation error"],
    "test_case_count": cases,
    "spj_mode": special_judge,
  }

  fs.writeFileSync(`${struct.path.solution}/exec.config`, JSON.stringify(config))

  try {
    await spawn('docker', ['exec', '-i', 'judgecore', './judgecore', `${struct.path.solution}/exec.config`]);
    const json = JSON.parse(fs.readFileSync(`${struct.path.exec_out}/result.json`, {encoding: 'utf8'}))

    const old_new_statsu_map = [107, 108, 102, 101, 103, 104, 105, 106, 109, 118];
    const result = old_new_statsu_map[json.status];

    const time = json.time;
    const memory = json.memory;

    let ac_count = 0
    if (json.detail) {
      json.detail.forEach(function (i) {
        i.extra = i.extra || json.extra;
        if (i.status === 0 || i.status === 1)
          ac_count += 1
      })
    }
    const score = parseInt(ac_count*100.0/cases)

    await db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, code_size = $4, score = $5, detail = $6::json, compile_info = $7 WHERE solution_id = $8 RETURNING "when"', [result, time, memory, code_length, score, JSON.stringify(json.detail).replace(/\u\d\d\d\d/gms, match => '\\'+match), json.compiler, solution_id])

  } catch (e) {
    console.error(e);
    db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, code_size = $4 WHERE solution_id = $5 RETURNING "when"', [101, 0, 0, code_length, solution_id]).then(()=>{}).catch((e)=>{console.error(e)})
    next(e)
  }

  unlinkTempFolder(solution_id).catch(() => {})
})


// // temp rejudge
//
// router.get('/rejudge/:sid', require_perm(REJUDGE_ALL), async (req, res, next) => {
//   'use strict'
//   const sid = parseInt(req.params.sid)
//   const p_ret = await db.query(`SELECT problem_id, language FROM solutions WHERE solution_id = ${sid}`)
//   if(p_ret.rows.length <= 0)
//     return res.fail(404)
//
//   const pid = p_ret.rows[0].problem_id
//   const lang = p_ret.rows[0].language
//   const ret = await db.query(
//     'SELECT time_limit, memory_limit, cases, special_judge::integer, detail_judge::integer, contest_id FROM problems WHERE problem_id = $1', [pid])
//   if (ret.rows.length === 0) return res.fail(404, 'problem not found')
//
//   const row = ret.rows[0]
//   const time_limit = row.time_limit
//   const memory_limit = row.memory_limit
//   const cases = row.cases
//   const special_judge = row.special_judge
//   const detail_judge = row.detail_judge
//   let cid = row.contest_id
//
//   let langExt = language_ext[lang]
//   let langName = language_ext[langExt]
//
//   const solution_id = sid
//
//   res.ok({solution_id})
//
//   const struct = getSolutionStructure(solution_id)
//   const pstruct = getProblemStructure(pid)
//
//   const filename = `main.${langExt}`;
//
//   const config = {
//     "debug": false, // [false]
//     "sid": solution_id, // [undefined]
//     "filename": filename, // <必填>
//     "lang": langName, // <必填>，可以是 c, c++, javascript, python, go
//     "pid": pid, // [undefined]
//     "max_time": time_limit, // [1000]
//     "max_time_total": 30000, // [30000]
//     "max_memory": memory_limit, // [65530]
//     "max_output": 10000000,  // [10000000]
//     "max_core": 4, // [4] 注意: 多核心 go 默认使用 4 核心
//     "on_error_continue": detail_judge ? true : ["accepted", "presentation error"], // [["accepted", "presentation error"]]，也可以是 true 或 false
//     "test_case_count": cases, // <必填>
//     "spj_mode": special_judge, // [no]，可以是 no, compare 或 interactive
//     "path": {
//       "base": DATA_BASE, // [/mnt/data]
//       "code": path.join(struct.path.solution, filename), // [<base>/code/<pid>/<sid>/]，如无 pid 和 sid 则必填
//       "log": null, // [<temp>]
//       "output": struct.path.exec_out, // [<base>/result/<pid>/<sid>/]，如无 pid 和 sid 则必填
//       "stdin": pstruct.path.data, // [<base>/case/<pid>/]，如无 pid 则必填，应包含 1.in - <test_case_count>.in
//       "stdout": null, // [<stdin>]，应包含 1.out - <test_case_count>.out
//       "temp": null, // [/tmp/]
//       "spj": pstruct.path.spj, // 如果 spj_mode 不是 no，[<base>/judge/<pid>]
//     }
//   }
//
//   fs.writeFileSync(`${struct.path.solution}/exec.config`, JSON.stringify(config))
//
//   await spawn('docker', ['exec', '-i', 'judgecore', './judgecore', `${struct.path.solution}/exec.config`]);
//
//   const json = JSON.parse(fs.readFileSync(`${struct.path.exec_out}/result.json`, {encoding: 'utf8'}))
//
//   try {
//     const old_new_statsu_map = [107, 108, 102, 101, 103, 104, 105, 106, 109, 118];
//     const result = old_new_statsu_map[json.status];
//
//     const time = json.time;
//     const memory = json.memory;
//
//     let ac_count = 0
//     if (json.detail) {
//       json.detail.forEach(function (i) {
//         i.extra = i.extra || json.extra;
//         if (i.status === 0 || i.status === 1)
//           ac_count += 1
//       })
//     }
//     const score = parseInt(ac_count*100.0/cases)
//
//     await db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, score = $4, detail = $5::json, compile_info = $6 WHERE solution_id = $7 RETURNING "when"', [result, time, memory, score, JSON.stringify(json.detail).replace(/\u\d\d\d\d/gms, match => '\\'+match), json.compiler, solution_id])
//
//     if (cid) {
//       // TODO: call util function to recount data to contest_users
//     }
//
//   } catch (e) {
//     console.error(e);
//     db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3 WHERE solution_id = $4 RETURNING "when"', [101, 0, 0, solution_id]).then(()=>{}).catch((e)=>{console.error(e)})
//     next(e)
//   }
//
//   unlinkTempFolder(solution_id).catch(() => {})
// })

module.exports = router
