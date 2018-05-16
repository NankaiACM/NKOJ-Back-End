const router = require('express').Router()
const db = require('../../database/db')
const fc = require('../../lib/form-check')

router.get('/list', async (req, res) => {
  'use strict'
  const values = [req.session.user]
  const queryString = 'SELECT * FROM solutions WHERE user_id = $1'
  const result = await db.query(queryString, values)
  return res.ok(result.rows)
})

router.post('/star_problem', fc.all('problem_id'), async (req, res) => {
  const values = [req.session.user, req.fcResult.problem_id]
  try {
    const queryString = 'INSERT INTO user_favo (user_id,problem_id) VALUES ($1,$2)'
    await db.query(queryString, values)
  }
  catch (err) {
    return res.fail(520, err)
  }
  return res.ok()
})
module.exports = router
