const router = require('express').Router()
const db = require('../database/db')
const check = require('../lib/form-check')


router.get('/list',  async (req, res) => {
  'use strict'
  const keys = ['user']
  const values = [req.session.user]
  const rules = []
  const form = {}
  let checkResult
  checkResult = check(keys, values, rules, form)
  if(checkResult) return res.fail(1, checkResult)

  const queryString = 'SELECT * FROM solutions WHERE user_id = $1'
  const result = await db.query(queryString, values)
  if(result.rows.length > 0){
    return res.ok(result.rows)
  }
  return res.fail(1, 'No solutions!')
})


module.exports = router
