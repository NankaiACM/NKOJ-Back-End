const router = require('express').Router()

const admin = require('./admin/admin')
const avatar = require('./avatar')
const contest = require('./contest')
const contests = require('./contests')
const danmaku = require('./danmaku')
const discuss = require('./discuss')
const judge = require('./judge')
const problem = require('./problem')
const problems = require('./problems')
const test = require('./test')
const user = require('./user/user')
const status = require('./status')

router.use('/admin', admin)
router.use('/avatar', avatar)
router.use('/c', contest) // like '/api/contest/1001', '/api/c/1001'
router.use('/contest', contest)
router.use('/contests', contests)
router.use('/danmaku', danmaku)
router.use('/discuss', discuss)
router.use('/judge', judge)
router.use('/p', problem) // '/api/p/1001', '/api/problem/1001'
router.use('/problem', problem)
router.use('/problems', problems)
router.use('/u', user)
router.use('/user', user)
router.use('/status', status)

// DEV: test
router.use('/test', test)

module.exports = router
