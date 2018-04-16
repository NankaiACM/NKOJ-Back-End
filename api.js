const router = require('express').Router()

const admin = require('./api/admin')
const avatar = require('./api/avatar')
const contest = require('./api/contest')
const contests = require('./api/contests')
const danmaku = require('./api/danmaku')
const discuss = require('./api/discuss')
const judge = require('./api/judge')
const problem = require('./api/problem')
const problems = require('./api/problems')
const test = require('./api/test')
const user = require('./api/user')
const status = require('./api/status')
const initData = require('./database/initData')


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
router.use('/test', initData)
router.use('/status', status)

// DEV: test
router.use('/test', test)

module.exports = router
