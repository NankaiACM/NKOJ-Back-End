const router = require('express').Router()
const {PROBLEM_PATH} = require('../config/basic')
const path = require('path')
const fs = require('fs')
const db = require('../database/db')
const {splitFileString} = require('../lib/problem')
const {require_perm, check_perm, SUPER_ADMIN} = require('../lib/permission')

router.get('/:pid', async (req, res) => {
  'use strict'
  const pid = req.params.pid
  const ret = await db.query('SELECT * FROM problems WHERE problem_id = $1', [pid])
  if (ret.rows.length === 0) return res.fatal(404)
  let c_ret = await db.query('SELECT * FROM contest_problems LEFT JOIN contests ON contest_problems.contest_id = contests.contest_id WHERE problem_id = $1 AND CURRENT_TIMESTAMP < lower(contests.during)', [pid])
  if(c_ret.rows.length !== 0){
    if(! (await check_perm(req, SUPER_ADMIN))) return res.fatal(404)
  }
  c_ret = await db.query('SELECT * FROM contest_problems LEFT JOIN contests ON contest_problems.contest_id = contests.contest_id WHERE CURRENT_TIMESTAMP < upper(contests.during) and contests.rule = \'oi\'')
  c_ret.rows.forEach(function(c_p, index){
    if(pid == c_p["problem_id"]) ret.rows[0]["ac"] = 1551
  })

  const tags = await db.query('SELECT problem_tag_assoc.tag_id as id, official, positive as p, negative as n, tag_name as name FROM problem_tag_assoc INNER JOIN problem_tags ON problem_tags.tag_id = problem_tag_assoc.tag_id WHERE problem_id = $1', [pid])
  ret.rows[0].tags = tags.rows
  const readPath = path.resolve(PROBLEM_PATH, `${pid}.md`)
  if (fs.existsSync(readPath)) {
    const content = splitFileString(fs.readFileSync(readPath).toString())
    res.ok(Object.assign(ret.rows[0], {keys: Object.keys(content), content: content}))
  } else {
    res.ok( 'data not found')
  }
})

router.get('/:pid/tag', require_perm(), async (req, res) => {
  const pid = Number(req.params.pid)
  const user_id = req.session.user
  if (!Number.isInteger(pid)) return next()
  const dbres = await db.query('SELECT * FROM problem_tag_votes WHERE user_id = $1 AND problem_id = $2', [user_id, pid])
  return res.ok(dbres.rows)
})

router.get('/:pid/:type/:tid', require_perm(), async (req, res, next) => {
  const pid = Number(req.params.pid)
  const tid = Number(req.params.tid)
  if (!Number.isInteger(pid) || !Number.isInteger(tid))
    return next()
  const type = req.params.type
  let ret
  try {
    switch (type) {
      case 'upvote':
        ret = await db.query('INSERT INTO problem_tag_votes (user_id, tag_id, problem_id, attitude) VALUES ($1, $2, $3, $4)', [req.session.user, tid, pid, true])
        break
      case 'downvote':
        ret = await db.query('INSERT INTO problem_tag_votes (user_id, tag_id, problem_id, attitude) VALUES ($1, $2, $3, $4)', [req.session.user, tid, pid, false])
        break
      case 'remove':
        ret = await db.query('DELETE FROM problem_tag_votes WHERE user_id = $1 and tag_id = $2 and problem_id = $3', [req.session.user, tid, pid])
        break
      default:
        return next()
    }
  } catch (e) {
    return res.fail(1)
  }
  res.ok({affected: ret.rowCount})
})

// TODO: admin download data

module.exports = router
