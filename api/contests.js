const router = require('express').Router()
const db = require('../database/db')
const check = require('../lib/form-check')

router.post('/list', async (req, res) => {
  'use strict'
  const keys = ['integer', 'integer']
  const values = [req.body.queryleft, req.body.queryright]
  const rules = []
  const form = {}
  let checkResult
  if(checkResult = check(keys, values, rules, form)) return res.fail(1, checkResult)
  const query = "SELECT * FROM contests WHERE contest_id BETWEEN $1 AND $2"

  let result = await db.query(query, values)
  if (result) {
    return res.ok(result.rows)
  }
  return res.fail(1, 'Unknown problems')
})

module.exports = router
