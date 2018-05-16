const router = require('express').Router()
const db = require('../database/db')
const fc = require('../lib/form-check')

// TODO: unify list logic, test
router.get('/list', fc.all(['l', 'r']), async (req, res) => {
  'use strict'
  const values = [req.fcResult.l, req.fcResult.r]
  const query = 'SELECT * FROM contests WHERE contest_id BETWEEN $1 AND $2'

  let result = await db.query(query, values)
  if (result) {
    return res.ok(result.rows)
  }
  return res.fail(1, 'Unknown problems')
})

module.exports = router
