const router = require('express').Router()

const login = require('./user_login')
const register = require('./user_register')
const user_check = require('./user_check')
const update = require('./user_update')
const api_key = require('./user_api')
const problems = require('./user_problems')
const contest = require('./user_contest')
const db = require('../../database/db')
const fc = require('../../lib/form-check')
const {require_perm} = require('../../lib/permission')

const queryUserInfo = async function (uid) {
  const result = await db.query('SELECT * FROM users WHERE user_id = $1', [uid])
  const ac = await db.query('with t as (' +
    '  select distinct problem_id, status_id from solutions where user_id = $1' +
    ') select ARRAY((select distinct problem_id from t where status_id = 107)) as ac, ARRAY((select distinct problem_id from t)) as all', [uid])
    
  //oi check
  let c_ret = await db.query('SELECT * FROM contest_problems LEFT JOIN contests ON contest_problems.contest_id = contests.contest_id WHERE CURRENT_TIMESTAMP < upper(contests.during) AND contests.rule=\'oi\'')
  let c_dic = {}
  c_ret.rows.forEach(function(c_p, index){
    c_dic[c_p["problem_id"]] = "OI"
  })
  let ac_list = []
  ac.rows[0]["ac"].forEach(function(solution, index){
    if(typeof(c_dic[solution]) == "undefined") ac_list.push(solution)
  })
  ac.rows[0]["ac"] = ac_list

  //acm check
  c_ret = await db.query('SELECT * FROM secret_time WHERE CURRENT_TIMESTAMP < UPPER(during)')
  if(c_ret.rows.length > 0){
    ac.rows[0]["ac"] = []
  }

  let row = result.rows[0]
  let {password, old_password, ...ret} = row
  return {...ret, ...ac.rows[0]}
}

router.get('/:uid(\\d+)?', require_perm(), async (req, res) => {
  'use strict'
  const user = Number(req.params.uid) || req.session.user
  try {
    const ret = await queryUserInfo(user)
    return res.ok(ret)
  } catch (e) {
    return res.fail(404)
  }
})

router.get('/info/:nickname', require_perm(), fc.all(['nickname']), async (req, res) => {
  'use strict'
  const user = req.fcResult.nickname
  console.log(user)
  try {
    const user_id_result = await db.query('SELECT user_id from user_nick where lower(nickname) = lower($1)', [user])
    const uid = user_id_result.rows[0].user_id
    const ret = await queryUserInfo(uid)
    return res.ok(ret)
  } catch (e) {
    return res.fail(404)
  }
})

router.use(login)
router.use(register)
router.use(user_check)
router.use(update)
router.use(contest)
router.use(problems)
router.use('/key', require_perm(), api_key)

module.exports = router
