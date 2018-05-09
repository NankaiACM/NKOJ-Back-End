const {DB_USER} = require('../config/redis')
const redis = require('../lib/redis')(DB_USER)
const db = require('../database/db')
const router = require('express').Router()
const fs = require('fs')
const {AVATAR_PATH} = require('../config/basic')
const avatar = async (key) => {
  'use strict'
  if (Number.isInteger(Number(key)))
    return await redis.getAsync(`avatar:${key}`)
  else {
    key = await db.query('SELECT user_id FROM users WHERE nickname = $1', [key])
    if (key.rows.length) return await redis.getAsync(`avatar:${key.rows[0].user_id}`)
  }
  return 'default.png'
}

router.get('/:key', async (req, res) => {
  'use strict'
  const key = req.params.key
  const file = await avatar(key)
  if (fs.existsSync(`${AVATAR_PATH}/${file}`)) {
    res.sendFile(`${AVATAR_PATH}/${file}`)
  } else {
    res.sendFile(`${AVATAR_PATH}/default.png`)
  }
})

module.exports = router
