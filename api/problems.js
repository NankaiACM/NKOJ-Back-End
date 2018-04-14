const router = require('express').Router()
const db = require('../database/db')
const check = require('../lib/form-check')

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
