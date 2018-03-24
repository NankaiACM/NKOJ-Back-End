const router = require('express').Router()
const db = require('./db')
const fs = require('fs')
const redis = require('redis')
const client = redis.createClient()
const {DB_PROBLEM, DB_CONTEST} = require('../config/redis')

router.get('/initProblems', async (req, res)  => {

  client.select(DB_PROBLEM)
  for (let i = 1001; i <= 1020; i++) {
    client.set('problem:' + i, i + '.md')
    let result = await db.query('SELECT * FROM problems WHERE problem_id = $1', [i])
    if(result.rows.length > 0) continue
    await db.query('INSERT INTO problems (problem_id, title) VALUES ($1, $2)', [i, i + '_problems'])
  }
  for (let i = 1001; i <= 1020; i++) {
    client.get('problem:' + i, redis.print)
  }
  res.ok(0, 'Success Init!')
})

router.get('/initContests', async (req, res)  => {
  console.log('wtf')
  client.select(DB_CONTEST)
  for (let i = 1; i <= 20; i++) {
    client.set('contest_rule:' + i, 'contest_rule_' + i + '.md')
    client.set('contest_about:' + i, 'contest_about_' + i + '.md')
    let result = await db.query('SELECT * FROM contests WHERE contest_id = $1', [i])
    if(result.rows.length > 0) continue
    const description = 'This is ' + i + ' contest!'
    await db.query('INSERT INTO contests (contest_id, title, during, description, problems) VALUES ($1, $2, $3, $4, $5)',
      [i, i + '_contests',  `[${2010+i}-01-01 14:30, ${2010+i}-01-01 15:30)`, description, '{1001, 1002, 1003, 1004, 1005, 1006, 1007}'])
  }
  db.query('INSERT INTO contests (contest_id, title, during, description, problems) VALUES ($1, $2, $3, $4, $5)',
    [21, 21 + '_contests',  `[2010-01-01 14:30, 2019-01-01 15:30)`, 'emmmmmm', '{1001, 1002, 1003, 1004, 1005, 1006, 1007}'])
  for (let i = 1; i <= 20; i++) {
    client.get('contest_rule:' + i, redis.print)
  }
  res.ok(0, 'Success Init!')
})



module.exports = router
