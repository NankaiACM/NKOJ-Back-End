const router = require('express').Router()
const role = require('./admin_role')
const user = require('./admin_user')

const {check_perm, MANAGE_ROLE} = require('../lib/perm-check')

router.use('/role', check_perm(MANAGE_ROLE), role)
router.use('/user', check_perm(MANAGE_ROLE), user)

module.exports = router
