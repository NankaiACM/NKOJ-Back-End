const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const redis = require('redis')
const client = redis.createClient()
const {DB_CONTEST} = require('../config/redis')
const path = require('path')
client.select(DB_CONTEST)

router.get('/:contest_id', async (req, res) => {
  'use strict'
  const contestId = req.params.contest_id
  const queryString = 'SELECT *, lower(during) AS start, upper(during) AS end FROM contests WHERE contest_id = $1'

  let result = await db.query(queryString, [contestId])
  if (result.rows.length > 0) {
    result.rows[0].info = ['Rules', 'About']
    return res.ok(result.rows[0])
  }
  return res.fail(1, 'No contest!')
})

router.get('/:contest_id/getProblem', async(req, res) => {
  'use strict'
  const contestId = req.params.contest_id
  const queryString = "WITH t AS (SELECT problems FROM contests WHERE contest_id = $1 LIMIT 1) SELECT problems.* FROM problems, t WHERE problem_id = ANY(t.problems)"
  let result = await db.query(queryString, [contestId])
  if (result.rows.length > 0) {
    return res.ok(result.rows)
  }
  return res.fail(1, 'No contest!')
})

const {CONTEST_PATH} = require('../config/basic')
router.get('/:contest_id/rules', async (req, res) => {
  'use strict'
  const contestId = req.params.contest_id
  client.get('contest_rule:' + contestId, (err, filename) => {
    let readDir = path.join(CONTEST_PATH, filename)
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
    let readDir = path.join(CONTEST_PATH, filename)
    if (!err) {
      res.sendFile(path.resolve(readDir), (err) => {
        if (err) res.fail(1, err)
      })
    } else {
      res.fail(1, 'No contest about file!')
    }
  })
})

router.get('/:contest_id/user', async (req, res) => {
  'use strict'
  const contest_id = req.params.contest_id
  let queryString = 'SELECT * FROM contest_users WHERE contest_id = $1'
  let result = db.query(queryString, [contest_id])
  if(result.rows.length > 0){
    return res.ok(result)
  } else return res.fail(1, 'No User!')
})

module.exports = router
