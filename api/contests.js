const router = require('express').Router()
const db = require('../database/db')
//const check = require('../lib/form-check')
const { matchedData} = require('express-validator/filter');
const {validationResult}=require('express-validator/check')
const check=require('../lib/form-check1')

router.post('/list', [check.queryleft,check.queryright],async (req, res) => {
  'use strict'
  /*const keys = ['integer', 'integer']
  const values = [req.body.queryleft, req.body.queryright]
  const rules = []
  const form = {}
  let checkResult
  if(checkResult = check(keys, values, rules, form)) return res.fail(1, checkResult)*/
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }
  const checkres = matchedData(req);
  const values=[checkres.queryleft, checkres.queryright]
  const query = "SELECT * FROM contests WHERE contest_id BETWEEN $1 AND $2"

  let result = await db.query(query, values)
  if (result) {
    return res.ok(result.rows)
  }
  return res.fail(1, 'Unknown problems')
})

module.exports = router
