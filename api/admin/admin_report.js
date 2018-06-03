const db = require('../../database/db')
const router = require('express').Router()

// 列出未处理的举报

router.get('/', async (req, res) => {

})

// 列出全部举报

router.get('/all', async (req, res) => {

})

// 处理举报，降低用户权限，扣分

router.get('/approve/:rid/', async (req, res) => {

})

// 拒绝举报，识别恶意举报，扣分

router.get('/decline/:rid/', async (req, res) => {

})

module.exports = router
