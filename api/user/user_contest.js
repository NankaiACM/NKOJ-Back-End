const router = require('express').Router()
const db = require('../../database/db')

Date.prototype.format = require('../../lib/dateFormat')

router.get('/contest/register/:contest_id', async (req, res) => {
  'use strict'
  if (!req.session.user) return res.fatal(401)
  const contest_id = req.params.contest_id
  let queryString = 'SELECT * FROM contests WHERE contest_id = $1'
  let result = await db.query(queryString, [contest_id])
  if (result.rows.length > 0) {
    queryString = 'SELECT * FROM contests WHERE contest_id = $1 AND during @> $2'
    let nowtime = new Date().format('yyyy-MM-dd hh:mm:ss')
    nowtime = '[' + nowtime.toString() + ',' + nowtime.toString() + ']'
    console.log(nowtime)
    result = await db.query(queryString, [contest_id, nowtime])
    if (result.rows.length > 0) {
      queryString = 'INSERT INTO contest_users (contest_id, user_id) VALUES ($1, $2)'
      result = await db.query(queryString, [contest_id, req.session.user])
      console.log(result)
      res.ok('Success!')
    } else {
      res.fail(2, 'Contest was over!')
    }
  } else
    return res.fail(1, 'No contest!')
})

router.get('contest/list', async (req, res) => {
  if (!req.session.user) return res.fatal(401)
  let queryString = 'SELECT * FROM contest_users WHERE user_id = $1'
  let result = db.query(queryString, [user_id])
  if (result.rows.length > 0) {
    return res.ok(result.rows[0])
  } else return res.fail(1, 'No contest!')
})

module.exports = router
