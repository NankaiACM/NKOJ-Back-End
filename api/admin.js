const router = require('express').Router()
const user = require('./admin_user')

router.use('/user', user)

module.exports = router
