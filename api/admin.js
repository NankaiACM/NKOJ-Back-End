const router = require('express').Router()
const database = require('./admin_db')

router.use('/db', database)

module.exports = router
