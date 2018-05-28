const router = require('express').Router()

const login = require('./user_login')
const register = require('./user_register')
const user_check = require('./user_check')
const update = require('./user_update')
const problems = require('./user_problems')
const contest = require('./user_contest')
const db = require('../../database/db')
const {require_perm} = require('../../lib/permission')


router.get('/:uid(\\d+)?', require_perm(), async (req, res) => {
  'use strict'
  const user = Number(req.params.uid) || req.session.user
  const result = await db.query('SELECT * FROM users WHERE user_id = $1', [user])
  if (result.rows.length) {
    delete result.rows[0].password
    return res.ok(result.rows[0])
  }
  res.fail(404)
})

router.use(login)
router.use(register)
router.use(user_check)
router.use(update)
router.use(contest)
router.use(problems)

module.exports = router
