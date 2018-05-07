const router = require('express').Router()
const db = require('../database/db')

router.get('/', async (req, res) => {
  'use strict'
  const ret = await db.query('SELECT * FROM user_danmaku ORDER BY "when" desc LIMIT 100')
  res.ok(ret.rows.reverse())
})

module.exports = router
