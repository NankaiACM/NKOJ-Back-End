const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const redis = require('redis')
const client = redis.createClient()
const {DB_PROBLEM} = require('../config/redis')
const {DB_CONTEST} = require('../config/redis')
const {promisify} = require('util')
const setAsync = promisify(client.set).bind(client)
const getAsync = promisify(client.get).bind(client)
const multer = require('multer')
const path = require('path')
const md5 = require('../lib/md5')
const check = require('../lib/form-check')
const {SOLUTION_PATH} = require('../config/basic')
const {GET_CODE_SELF}=require('../lib/perm-check')
const {check_perm}=require('../lib/perm-check')

router.post('/list',  async (req, res) => {
  'use strict'
  const keys = ['integer', 'integer']
  const values = [req.body.queryleft, req.body.queryright]
  const rules = []
  const form = {}
  let checkResult
  checkResult = check(keys, values, rules, form)
  if(checkResult) return res.fail(1, checkResult)

  const queryString = 'SELECT * FROM status WHERE solution_id BETWEEN $1 AND $2'
  const result = await db.query(queryString, values)
  if(result.rows.length > 0){
    return res.ok(result.rows)
  }
  return res.fail(1, 'No solutions!')
})

router.post('/code', check_perm(GET_CODE_SELF),  async (req, res) => {
  'use strict'
  const keys = ['integer']
  const values = [req.body.solutionId]
  const rules = []
  const form = {}
  let checkResult
  checkResult = check(keys, values, rules, form)
  if(checkResult) return res.fail(1, checkResult)
  const queryString = 'SELECT user_id FROM solutions WHERE solution_id = $1 '
  const result = await db.query(queryString, values)
  if(result.rows.length > 0){
    if(req.session.user===result.rows[0].user_id) {
      if (fs.existsSync(`${SOLUTION_PATH}/${values[0]}`)) {
        res.sendFile(`${SOLUTION_PATH}/${values[0]}`)
      } else {
        res.fail(1,'No solution\'s file')
      }
    }
    else res.fail(1,'other\'s code')
  }
  return res.fail(1, 'No solutions!')
})



module.exports = router
