const router = require('express').Router()
const fs = require('fs')
const db = require('../database/db')
const {require_perm, check_perm, SUPER_ADMIN, REJUDGE_ALL} = require('../lib/permission')
const fc = require('../lib/form-check')
const {getSolutionStructure} = require('../lib/judge')
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
  const {time_limit, memory_limit, cases, special_judge, detail_judge } = row;
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
})


// temp rejudge

router.get('/rejudge/:sid', require_perm(REJUDGE_ALL), async (req, res, next) => {
  'use strict'
  const sid = parseInt(req.params.sid)
  const p_ret = await db.query(`SELECT problem_id, language FROM solutions WHERE solution_id = ${sid}`)
  if(p_ret.rows.length <= 0)
    return res.fail(404)

  const pid = p_ret.rows[0].problem_id
  const lang = p_ret.rows[0].language

  const ret = await db.query(
    'SELECT time_limit, memory_limit, cases, special_judge::integer, detail_judge::integer, contest_id FROM problems WHERE problem_id = $1', [pid])
  if (ret.rows.length === 0) return res.fail(404, 'problem not found')
  if (language_ext[lang] === null) return res.fail(404, 'language not supported')

  const row = ret.rows[0]
  const {time_limit, memory_limit, cases, special_judge, detail_judge } = row;

  let langExt = language_ext[lang]
  let langName = language_ext[langExt]

  const solution_id = sid

  const struct = getSolutionStructure(solution_id)

  const filename = `main.${langExt}`;

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

    await db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3, score = $4, detail = $5::json, compile_info = $6 WHERE solution_id = $7 RETURNING "when"', [result, time, memory, score, JSON.stringify(json.detail).replace(/\u\d\d\d\d/gms, match => '\\'+match), json.compiler, solution_id])
    res.ok({json})
  } catch (e) {
    console.error(e);
    db.query('UPDATE solutions SET status_id = $1, "time" = $2, "memory" = $3 WHERE solution_id = $4 RETURNING "when"', [101, 0, 0, solution_id]).then(()=>{}).catch((e)=>{console.error(e)})
    next(e);
  }
})

const custom_lang = [
  {
    "id": 2,
    "name": "javascript",
    "ext": "js",
    "compiler": false,
    "cargs": null,
    "cscript": null,
    "executable": "/usr/bin/v8/d8",
    "eargs": "$code"
  }, {
    "id": 3,
    "name": "python",
    "ext": "py",
    "compiler": "python",
    "cargs": ["-OO", "$script"],
    "cscript": ["from modulefinder import ModuleFinder\nfinder = ModuleFinder()\nfinder.run_script('", "$code", "')\nbadmodules = []\nif len(finder.badmodules) is 0:\n  pass\nelse:\n  for package in finder.badmodules:\n    if '__main__' in finder.badmodules[package]:\n      badmodules.append(package)\nif len(badmodules) is not 0:\n  raise ModuleNotFoundError(' '.join(badmodules))\nimport py_compile\npy_compile.compile('", "$code", "', cfile='", "$exec", ".pyc', doraise=True)\n"],
    "executable": "python",
    "eargs": [["$exec", ".pyc"]]
  }, {
    "id": 4,
    "name": "go",
    "ext": "go",
    "compiler": "go",
    "cargs": ["build", "-o", "$exec", "$code"],
    "cscript": null,
    "executable": "$exec",
    "eargs": null
  }, {
    "id": 6,
    "name": "pypy3",
    "ext": "py",
    "compiler": "/usr/bin/pypy/bin/pypy3",
    "cargs": ["-OO", "$script"],
    "cscript": ["from modulefinder import ModuleFinder\nfinder = ModuleFinder()\nfinder.run_script('", "$code", "')\nbadmodules = []\nif len(finder.badmodules) is 0:\n  pass\nelse:\n  for package in finder.badmodules:\n    if '__main__' in finder.badmodules[package]:\n      badmodules.append(package)\nif len(badmodules) is not 0:\n  raise ModuleNotFoundError(' '.join(badmodules))\nimport py_compile\npy_compile.compile('", "$code", "', cfile='", "$exec", ".pyc', doraise=True)\n"],
    "executable": "/usr/bin/pypy/bin/pypy3",
    "eargs": [["$exec", ".pyc"]]
  }, {
    "id": 91,
    "name": "custom_c",
    "ext": "c",
    "compiler": "gcc",
    "cargs": ["$customArgs", "-Wall", "-Wextra", "-o", "$exec", "$code"],
    "cscript": [],
    "executable": "$exec",
    "eargs": ["$customArgs"]
  }, {
    "id": 92,
    "name": "custom_c++",
    "ext": "cpp",
    "compiler": "g++",
    "cargs": ["$customArgs", "-Wall", "-Wextra", "-o", "$exec", "$code"],
    "cscript": [],
    "executable": "$exec",
    "eargs": ["$customArgs"]
  }
]

router.get('/custom', require_perm(), async (req, res, next) => {
  res.ok(custom_lang);
})

const bodyParser = require('body-parser')
const {DB_RATE_LIMIT} = require('../config/redis')
const client = require('../lib/redis')(DB_RATE_LIMIT)
const {DATA_BASE} = require('../config/basic')

router.post('/custom', require_perm(),
  bodyParser.json({limit: '10mb', type: 'application/x-large-json'}),
  async (req, res, next) => {
    const id = await client.incrAsync("custom:id");
    const {code, lang, cargs, eargs} = req.body;
    let {inline} = req.body

    let lang_spec = undefined;
    for (let i of custom_lang) {
      if (i.id === Number(lang) || i.name === lang) {
        lang_spec = i;
        break;
      }
    }

    if (Array.isArray(inline)) {
      inline.map(o => {
        if (typeof o.fs === 'object' && (!o.stdin || typeof o.stdin === 'string'))
          return { fs: o.fs, stdin:o.stdin }
        else return {fs: {}, stdin: ''}
      })
    } else if (inline instanceof Object) {
      if (typeof inline.fs === 'object' && (!inline.stdin || typeof inline.stdin === 'string'))
        inline = [{ fs: inline.fs, stdin:inline.stdin }]
      else inline = null
    }

    if (lang_spec === undefined)
      return res.fail(400, "unknown language")
    if (!Array.isArray(cargs))
      return res.fail(400, "cargs is not an array")
    if (!Array.isArray(eargs))
      return res.fail(400, "eargs is not an array")

    let langExt = lang_spec.ext

    const codeFile = `${DATA_BASE}/custom/${id}.${langExt}`
    fs.writeFileSync(codeFile, code);

    const config = {
      "sid": "temp",
      "pid": "custom",
      "lang": lang_spec.name,
      "variant": {
        cargs,
        eargs,
      },
      "max_time": 10000,
      "max_memory": 524288,
      "max_output": 10485760,
      "max_thread": 4,
      "continue_on": false,
      "test_case_count": inline.length,
      "spj_mode": "inline",
      "path": {
        "code": codeFile,
        "temp": "/tmp/custom-"+id
      },
      inline
    }
    const configFile = `${DATA_BASE}/custom/${id}.config`;
    fs.writeFileSync(configFile, JSON.stringify(config))

    try {
      const { stdout } = await spawn('docker', ['exec', '-i', 'judgecore', './judgecore', configFile]);
      try {
        res.ok(JSON.parse(stdout))
      } catch (e) {
        res.fail(1, e, stdout)
      }
    } catch (e) {
      console.error(e);
      res.fatal(500, e);
    }
})

module.exports = router
