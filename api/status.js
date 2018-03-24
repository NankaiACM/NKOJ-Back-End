const router = require('express').Router()
const db = require('./db')
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

router.post('/list',  async (req, res) => {
  'use strict'
  const keys = ['integer', 'integer']
  const values = [req.body.queryleft, req.body.queryright]
  const rules = []
  const form = {}
  let checkResult
  checkResult = check(keys, values, rules, form)
  if(checkResult) return res.fail(1, checkResult)

  const queryString = 'SELECT * FROM solutions WHERE solutions_id BETWEEN $1 AND $2'
  const result = await db.query(queryString, values)
  if(result.rows.length > 0){
    res.ok(result.rows)
  }
  return res.fail(1, 'No solutions!')
})

module.exports = router
