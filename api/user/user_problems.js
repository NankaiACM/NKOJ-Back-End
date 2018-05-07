const router = require('express').Router()
const db = require('../../database/db')
//const check = require('../lib/form-check')
const {matchedData} = require('express-validator/filter')
const {validationResult} = require('express-validator/check')
const check = require('../../lib/form-check')

router.get('/list', async (req, res) => {
  'use strict'
  /*const keys = ['user']
  const values = [req.session.user]
  const rules = []
  const form = {}
  let checkResult
  checkResult = check(keys, values, rules, form)
  if(checkResult) return res.fail(1, checkResult)*/
  const values = [req.session.user]
  const queryString = 'SELECT * FROM solutions WHERE user_id = $1'
  const result = await db.query(queryString, values)
  if (result.rows.length > 0) {
    return res.ok(result.rows)
  }
  return res.fail(1, 'No solutions!')
})

router.post('/star_problem', check.problem_id, async (req, res) => {
  //const user_id=req.session.user;
  /*const problem_id=req.body.problem_id;
  const keys = ['integer','integer']
  const values = [user_id,problem_id]
  const rules = []
  const form = {}
  let checkResult
  checkResult = check(keys, values, rules, form)
  if(checkResult) return res.fail(1, checkResult)*/
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.fail(1, errors.array())
    return
  }
  const checkres = matchedData(req)
  const values = [req.session.user, checkres.problem_id]

  try {
    const queryString = 'INSERT INTO user_favo (user_id,problem_id) VALUES ($1,$2)'
    const result = await db.query(queryString, values)
  }
  catch (err) {
    return res.fail(520, err)
  }
  return res.ok(1, 'ok')
})
//求测试2333
/*router.get('/list_simple',async (req,res)=> {
  'use strict'
  const values=[req.session.user]
  const queryString = 'SELECT * FROM solutions WHERE user_id = $1'
  const queryString1 = 'SELECT problem_id FROM user_favo WHERE user_id = $1'
  const result = await db.query(queryString, values)
  const result1= await db.query(queryString1,values)
  if(result.rows.length > 0){

    const resjson={}
    resjson.start=[];
    resjson.ac=[];
    resjson.on=[];
    let tmphash=[];

    for(let i=0;i<result1.rows.length;i++) {
      const row = result1.rows[i];
      resjson.start.push(row.problem_id)
    }

    for(let i=0;i<result.rows.length;i++) {
      const row=result.rows[i];
      if(row.problem_id in resjson.ac )
      {
          continue
      }
      if(row.problem_id in tmphash )
      {
        if(row.problem_id=== 107)
        {
          tmphash = tmphash.filter(t => t !== row.problem_id)
          resjson.ac.push(row.problem_id)
        }
          continue
      }
      tmphash.append(row.problem_id);
    }
    return res.ok(resjson)
  }
  return res.fail(1, 'No solutions!')
})
*/
module.exports = router
