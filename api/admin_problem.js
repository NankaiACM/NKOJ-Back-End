const router = require('express').Router()
const add = require('./admin_problem_add')
const update = require('./admin_problem_update')
const data = require('./admin_problem_data')
const spj = require('./admin_problem_spj')

router.use('/add', add)
router.use('/update', update)
router.use('/data', data)
router.use('/spj', spj)

module.exports = router
