const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const path = require('path')
//const check = require('../lib/form-check')
const { matchedData} = require('express-validator/filter');
const {validationResult}=require('express-validator/check')
const check = require('../lib/form-check')
const {SOLUTION_PATH} = require('../config/basic')
const {GET_CODE_SELF, require_perm} = require('../lib/permission')

router.get('/init',async (req, res) => {
  'use strict'
  const initString = 'INSERT INTO solution_status (status_id, msg_short, msg_cn, msg_en) ' +
    'VALUES ($1, $2, $3, $4)'
  await db.query(initString, ['100', 'RU', '运行中', 'Running'])
  await db.query(initString, ['101', 'CE', '编译错误', 'Compile Error'])
  await db.query(initString, ['120', 'CI', '正在编译', 'Compiling'])
  await db.query(initString, ['102', 'WA', '答案错误', 'Wrong Answer'])
  await db.query(initString, ['103', 'RE', '运行错误', 'Runtime Error'])
  await db.query(initString, ['104', 'MLE', '内存超限', 'Memory Limit Exceed'])
  await db.query(initString, ['105', 'TLE', '时间超限', 'Time Limit Exceed'])
  await db.query(initString, ['106', 'OLE', '输出超限', 'Output Limit Exceed'])
  await db.query(initString, ['107', 'AC', '答案正确', 'Accepted'])
  await db.query(initString, ['108', 'PE', '格式错误', 'Presentation Error'])
  await db.query(initString, ['109', 'FL', '函数调用不合法', 'Function Limit Exceed'])
  await db.query(initString, ['118', 'SE', '未知错误', 'System Error'])

  return res.ok('init complete!')
})

router.post('/list',[check.queryleft,check.queryright],  async (req, res) => {
  'use strict'
  const errors = validationResult(req);
  if(!errors.isEmpty())
    return res.fail(1, errors.array())
  const checkres = matchedData(req);
  const values=[checkres.queryleft, checkres.queryright]
  const queryString = 'SELECT s.*, s2.* FROM solutions AS s INNER JOIN solution_status AS s2' +
    ' ON s.status_id = s2.status_id' +
    ' WHERE s.solution_id BETWEEN $1 AND $2' +
    ' ORDER BY s.solution_id'
  const result = await db.query(queryString, values)
  if (result.rows.length > 0)
    return res.ok(result.rows)
  return res.fail(1, 'No solutions!')
})

router.post('/code', require_perm(GET_CODE_SELF), check.solutionId, async (req, res) => {
  'use strict'
  /*const keys = ['integer']
  const values = [req.body.solutionId]
  const rules = []
  const form = {}
  let checkResult
  checkResult = check(keys, values, rules, form)
  if(checkResult) return res.fail(1, checkResult)*/
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }
  const checkres = matchedData(req);
  const values=[checkres.solutionId]
  const queryString = 'SELECT user_id FROM solutions WHERE solution_id = $1 '
  const result = await db.query(queryString, values)
  if(result.rows.length > 0){
    if(req.session.user===result.rows[0].user_id) {
      if (fs.existsSync(path.resolve(SOLUTION_PATH, values[0]))) {
        res.sendFile(path.resolve(SOLUTION_PATH, values[0]))
      } else {
        res.fail(1,'No solution\'s file')
      }
    }
    else res.fail(1,'other\'s code')
  }
  return res.fail(1, 'No solutions!')
})

router.get('/:problemId',check.problemId,async (req, res) => {
  'use strict'
  /*const problemId = req.params.problemId
  const keys = ['integer']
  const values = [problemId]
  const rules = []
  const form = {}
  let checkResult
  checkResult = check(keys, values, rules, form)
  if(checkResult) return res.fail(1, checkResult)*/

  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }
  const checkres = matchedData(req);
  const values=[checkres.solutionId]
  const queryString = 'SELECT * FROM status WHERE problem_id = $1 ORDER BY time,memory'
  const result = await db.query(queryString, values)
  if(result.rows.length > 0){
      return res.ok(result.rows)
    }
  else return res.fail(1, 'No solutions!')
})

module.exports = router
