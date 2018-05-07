const router = require('express').Router()
const db = require('../database/db')
//const check = require('../lib/form-check')
const { matchedData} = require('express-validator/filter');
const {validationResult}=require('express-validator/check')
const check=require('../lib/form-check')
const fs=require('fs')
const path=require('path')
const {PROBLEM_PATH,PROBLEM_DATA_PATH}=require('../config/basic')

router.get('/list', [check.l,check.r],async (req, res) => {
  'use strict'
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }
  const checkres = matchedData(req);
  let form={l:checkres.l,r:checkres.r}
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


router.post('/update',[check.id,check.title], async (req, res) => {
  'use strict'

  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }
  const checkres = matchedData(req);
  const values=[req.id,req.title]
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
