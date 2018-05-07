const router = require('express').Router()
const db = require('../database/db')
const {matchedData} = require('express-validator/filter')
const {validationResult} = require('express-validator/check')
const check = require('../lib/form-check')

router.post('/list', [check.queryleft, check.queryright], async (req, res) => {
  'use strict'
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.fail(1, errors.array())
    return
  }
  const checkres = matchedData(req)
  const values = [checkres.queryleft, checkres.queryright]
  const query = 'SELECT * FROM contests WHERE contest_id BETWEEN $1 AND $2'

  let result = await db.query(query, values)
  if (result) {
    return res.ok(result.rows)
  }
  return res.fail(1, 'Unknown problems')
})

module.exports = router
