const router = require('express').Router()
const db = require('../database/db')
const fs = require('fs')
const path = require('path')
const {matchedData} = require('express-validator/filter')
const {validationResult}=require('express-validator/check')
const check = require('../lib/form-check')
const {SOLUTION_PATH} = require('../config/basic')
const {GET_CODE_SELF, GET_CODE_ALL, check_perm} = require('../lib/permission')

router.get('/', async (req, res) => {
  'use strict'
  let limit = 20
  const queryString = 'SELECT * FROM user_solutions ORDER BY solution_id DESC LIMIT $1'
  const result = await db.query(queryString, [limit])
  if (result.rows.length > 0)
    return res.ok(result.rows)
  return res.sendStatus(204)
})

router.get('/:from(\\d+)/:limit(\\d+)?', async (req, res) => {
  'use strict'
  let from = Number(req.params.from)
  let limit = Number(req.params.limit || 0)
  if (limit > 50) limit = 50

  if (from < 0 || limit < 0) return next()

  const queryString = `SELECT * FROM user_solutions ORDER BY solution_id DESC LIMIT ${limit ? '$1 OFFSET $2' : 'cal_solution_limit($1)'}`
  const result = await db.query(queryString, limit ? [limit, from] : [from])
  if (result.rows.length > 0)
    return res.ok(result.rows)
  return res.sendStatus(204)
})

// router.get('/code/:solutionId(\\d+)?', check_perm(GET_CODE_SELF), async (req, res) => {
//   'use strict'
//
//   const sid = int(req.params.sid)
//   if(sid <= 0) return next()
//
//   const result = await db.query('SELECT user_id FROM solutions WHERE solution_id = $1 ', [sid])
//   if(result.rows.length > 0){
//     if(req.session.user===result.rows[0].user_id || check_perm(req, GET_CODE_ALL)) {
//       if (fs.existsSync(path.resolve(SOLUTION_PATH, sid))) {
//         res.sendFile(path.resolve(SOLUTION_PATH, sid))
//       } else {
//         res.fail(500, 'code file not found')
//       }
//     }
//     return res.fail(401)
//   }
//   return res.fail(404)
// })

module.exports = router
