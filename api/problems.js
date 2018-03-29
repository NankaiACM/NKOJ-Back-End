const router = require('express').Router()
const db = require('../database/db')
const check = require('../lib/form-check')
const fs=require('fs')
const path=require('path')
const {PROBLEM_PATH,PROBLEM_DATA_PATH}=require('../config/basic')

router.post('/list', async (req, res) => {
  'use strict'
  const keys = ['integer', 'integer']
  const values = [req.body.queryleft, req.body.queryright]
  const rules = []
  const form = {}
  let checkResult
  if(checkResult = check(keys, values, rules, form)) return res.fail(1, checkResult)

  const query = "SELECT * FROM problems WHERE problem_id BETWEEN $1 AND $2"
  let result = await db.query(query, values)
  if (result) {
    return res.ok(result.rows)
  }
  return res.fail(1, 'Unknown problems')
})


router.post('/update', async (req, res) => {
  'use strict'
  const values = [req.body.id.valueOf(), req.body.title]
  if(!Number.isInteger(values[0])){
    res.fail(1, {'error' : 'Not Integer!'})
    return
  }
  if(values[2].length > 30) {
    res.fail(1, {'error' : 'Title is too long!'})
    return
  }
  const queryCheck = "SELECT * FROM problems WHERE problem_id = $1"
  let result = await db.query(queryCheck, values[0])
  if(result.rows.length > 0){
    res.fail(1, {'error' : 'Problem exists!'})
    return
  }
  try {
    const query = "INSERT INTO problems (problem_id, title) VALUES ($1, $2)"
    result = await db.query(query, values)
    return res.ok()
  } catch(err){
    return res.fail(1, err)
  }
})
module.exports = router
