const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const fc = require('../lib/form-check')
const {check_perm, SUPER_ADMIN} = require('../lib/permission')
const {CONTEST_PATH} = require('../config/basic')

router.get('/:cid', fc.all(['cid']), async (req, res) => {
  'use strict'
  const cid = req.fcResult.cid

  const result = await db.query(
    'SELECT *, lower(during) AS start, upper(during) AS end FROM contests WHERE contest_id = $1', [cid]
  )
  if (result.rows.length === 0) return res.fail(404)

  const basic = result.rows[0]

  const problems = await db.query(
    'SELECT contest_problems.problem_id, submit_ac as ac, submit_all as all, title, special_judge, detail_judge, level' +
    ' FROM contest_problems LEFT JOIN problems ON contest_problems.problem_id = problems.problem_id WHERE contest_problems.contest_id = $1 ORDER BY contest_problems.problem_id', [cid]
  )
  //if(basic.rule == "oi"){
    problems.rows.forEach(p => {
      p.ac = 0
    });
  //}

  let file
  try {
    file = fs.readFileSync(`${CONTEST_PATH}/${cid}.md`, 'utf8')
  } catch (e) {

  }
  res.ok({...basic, problems: problems.rows, file})
})

router.get('/:cid(\\d+)/oirank', fc.all(['cid']), async (req, res) => {
    'use strict'
    const cid = req.fcResult.cid
    let result = await db.query(`SELECT * FROM contests WHERE contest_id = ${cid} AND CURRENT_TIMESTAMP < upper(contests.during)`)
    if(result.rows.length > 0){
      if (await check_perm(req, SUPER_ADMIN)) {} else return res.fail(404)
    }
    result = await db.query(`SELECT * FROM user_solutions LEFT JOIN user_info ON user_info.user_id = user_solutions.user_id WHERE contest_id = ${cid}  ORDER BY solution_id LIMIT 10086`)
    let dic = {}
    let tot = 0
    let ret = []
    result.rows.forEach((r) => {
      if(typeof(dic[r["user_id"]]) == "undefined"){
        dic[r["user_id"]] = tot++
        ret.push({"user_id": r["user_id"], "nickname": r["nickname"], "score" : 0, "info" : {}})
      }
      let id = dic[r["user_id"]]
      if(typeof(ret[id][r["problem_id"]]) != "undefined"){
        ret[id]["score"] -= ret[id][r["problem_id"]]
      }
      ret[id][r["problem_id"]] = r["score"]
      ret[id]["score"] += r["score"]
    })
    if(await check_perm(req, SUPER_ADMIN)){
      result = await db.query(`SELECT * FROM users_nkpc`)
      result.rows.forEach((r) => {
        if(typeof(dic[r["user_id"]]) != "undefined"){
          let id = dic[r["user_id"]]
          ret[id]["real_name"] = r["real_name"]
          ret[id]["student_number"] = r["student_number"]
          ret[id]["gender"] = r["gender"]
          ret[id]["institute"] = r["institute"]
          ret[id]["qq"] = r["qq"]
          ret[id]["phone"] = r["phone"]
        }
      })
    }
    ret.sort( (x, y) => {
      if(x["score"] < y["score"]){
        return 1;
      } else if(x["score"] > y["score"]){
        return -1;
      } else return 0;
    })
    return res.ok(ret)
})

router.get('/:cid/user', fc.all(['cid']), async (req, res) => {
  'use strict'
  const cid = req.fcResult.cid
  const result = await db.query('SELECT * FROM contest_users WHERE contest_id = $1', [cid])
  res.ok(result.rows)
})

router.get('/:cid/first_ac_all',fc.all(['cid']),async (req,res)=>{
    'use strict'
    const cid = req.fcResult.cid
    const c_ret = await db.query(`SELECT * FROM contests WHERE contest_id = ${cid}`)
    //if(c_ret.rows[0].rule == "oi"){
      return res.fail(404)
    //}
    const result = await db.query('SELECT * FROM user_solutions WHERE solution_id IN (SELECT min(solution_id) FROM solutions WHERE contest_id = $1 AND status_id = 107 GROUP BY problem_id ORDER BY min(solution_id))', [cid])
    res.ok(result.rows)
})

router.get('/:cid/own_submitted', fc.all(['cid']),async (req, res)=>{
  'use strict'
  const cid = req.fcResult.cid
  const c_ret = await db.query(`SELECT ARRAY(SELECT problem_id FROM user_solutions WHERE contest_id = $1 AND user_id = $2 AND status_id <> 101 GROUP BY problem_id ORDER BY problem_id) AS array`, [cid, req.session.user])
  if (c_ret.rows.length) {
    res.ok(c_ret.rows[0].array)
  } else {
    return res.fail(404)
  }
})

module.exports = router
