const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const redis = require('redis')
const client = redis.createClient()
const {promisify} = require('util')
const multer = require('multer')
const path = require('path')
const md5 = require('../lib/md5')

router.post('/list', async (req, res) => {
  'use strict'
  const values = [req.body.queryleft, req.body.queryright]
  if (!Number.isInteger(values[0]) || !Number.isInteger(values[1])) {
    return res.ok(1, {'error': 'Not Integer!'})
  }
  const query = "SELECT * FROM problems WHERE problem_id BETWEEN $1 AND $2"
  let result = await db.query(query, values)
  if (result) {
    return res.ok(0, result.rows)
  }
  return res.fail(1, 'Unknown problems')
})  
router.post('/update', async (req, res) => {
  'use strict'
  const values = [req.body.id.valueOf(), req.body.title]
  if(!Number.isInteger(values[0])){
    res.ok(1, {'error' : 'Not Integer!'})
    return
  }
  if(values[2].length > 30) {
    res.ok(1, {'error' : 'Title is too long!'})
    return
  }
  const queryCheck = "SELECT * FROM problems WHERE problem_id = $1"
  let result = await db.query(queryCheck, values[0])
  if(result.row.length > 0){
    res.ok(1, {'error' : 'Problem exists!'})
    return
  }
  try {
    const query = "INSERT INTO problems (problem_id, title) VALUES ($1, $2)"
    result = await db.query(query, values)
    return res.ok(0, {'success': result})
  } catch(err){
    return res.fail(1, err)
  }
})
module.exports = router
