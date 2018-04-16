const router = require('express').Router()
const db = require('../database/db')
const check = require('../lib/form-check')
const fs=require('fs')
const path=require('path')

router.get('/list', async (req, res) => {
  'use strict'
  const keys = ['l', 'r']
  const values = [req.query.l, req.query.r]
  const rule = {empty: 'remove', type: 'integer'}
  const rules = [rule, rule]
  const form = {}
  let checkResult
  if (checkResult = check(keys, values, rules, form))
    return res.fail(1, checkResult)

  let offset = form.l - 1 || 0
  let requested = form.r ? (form.r - offset) : 20
  let limit = requested > 50 ? 50 : requested
  let result = await db.query('SELECT * FROM problems order by problem_id limit $1 offset $2', [limit, offset])
  if (result.rows.length) {
    return res.ok({
      requested: requested,
      served: result.rows.length,
      is_end: result.rows.length !== limit,
      list: result.rows
    })
  }
  return res.fatal(404)
})

module.exports = router
