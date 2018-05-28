const router = require('express').Router()

const login = require('./user_login')
const register = require('./user_register')
const user_check = require('./user_check')
const update = require('./user_update')
const problems = require('./user_problems')
const contest = require('./user_contest')
const db = require('../../database/db')
const {require_perm} = require('../../lib/permission')

router.get('/', require_perm(), async (req, res) => {
  'use strict'
  const user = req.session.user
  const result = await db.query('SELECT * FROM users WHERE user_id = $1', [user])
  delete result.rows[0].password
  res.ok(result.rows[0])
})

router.get('/:user_code', require_perm(), async (req, res) => {
  'use strict'
  const user = req.params.user_code
  const result = await db.query('SELECT * FROM users WHERE user_id = $1', [user])
  delete result.rows[0].password
  res.ok(result.rows[0])
})

router.use(login)
router.use(register)
router.use(user_check)
router.use(update)
router.use(contest)
router.use(problems)

module.exports = router
