const router = require('express').Router()

const email = require('./admin_email')
const role = require('./admin_role')
const user = require('./admin_user')
const contest = require('./admin_contest')

const {check_perm, MANAGE_ROLE, SUPER_ADMIN} = require('../lib/perm-check')

router.use('/email', check_perm(SUPER_ADMIN), email)
router.use('/role', check_perm(MANAGE_ROLE), role)
router.use('/user', check_perm(MANAGE_ROLE), user)
router.use('/contest', check_perm(MANAGE_ROLE), contest)

module.exports = router
