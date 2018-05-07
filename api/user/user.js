const router = require('express').Router()

const login = require('./user_login')
const register = require('./user_register')
const user_check = require('./user_check')
const update = require('./user_update')
const problems = require('./user_problems')
const contest = require('./user_contest')

router.use(login)
router.use(register)
router.use(user_check)
router.use(update)
router.use(contest)
router.use(problems)

module.exports = router
