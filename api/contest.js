const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const check = require('../lib/form-check')
const redis = require('redis')
const client = redis.createClient()
const {DB_CONTEST} = require('../config/redis')
const {promisify} = require('util')
const setAsync = promisify(client.set).bind(client)
const getAsync = promisify(client.get).bind(client)
const multer = require('multer')
const path = require('path')
const md5 = require('../lib/md5')
client.select(DB_CONTEST)

router.get('/:contest_id', async (req, res) => {
  'use strict'
  const contestId = req.params.contest_id
  const queryString = 'SELECT * FROM contests WHERE contest_id = $1'
  let result = await db.query(queryString, [contestId])
  if (result.rows.length > 0) {
    return res.ok(result.rows[0])
  }
  return res.fail(1, 'No contest!')
})

const {CONTEST_PATH} = require('../config/basic')
router.get('/:contest_id/rule', async (req, res) => {
  'use strict'
  const contestId = req.params.contest_id
  client.get('contest_rule:' + contestId, (err, filename) => {
    let readDir = path.join('./public/', CONTEST_PATH)
    readDir = path.join(readDir, filename)
    if (!err) {
      return res.sendFile(path.resolve(readDir), (err) => {
        if (err) res.fail(1, err)
      })
    } else {
      return res.fail(1, 'No contest rule file!')
    }
  })
})

router.get('/:contest_id/about', async (req, res) => {
  'use strict'
  const contestId = req.params.contest_id
  client.get('contest_about:' + contestId, (err, filename) => {
    let readDir = path.join('./public/', CONTEST_PATH)
    readDir = path.join(readDir, filename)
    if (!err) {
      res.sendFile(path.resolve(readDir), (err) => {
        if (err) res.fail(1, err)
      })
    } else {
      res.fail(1, 'No contest about file!')
    }
  })
})

module.exports = router
