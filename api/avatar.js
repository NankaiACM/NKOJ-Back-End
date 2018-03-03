const redis = require('redis')
const client = redis.createClient()
const {DB_USER} = require('../config/redis')
client.select(DB_USER)
const promisify = require('util').promisify
const getAsync = promisify(client.get).bind(client)

const db = require('../database/db')
const router = require('express').Router()

const avatar = async (key) => {
  'use strict'
  if (Number.isInteger(Number(key)))
    return await getAsync(`avatar:${key}`)
  else {
    console.log('123')
    key = await db.query('SELECT user_id FROM users WHERE nickname = $1', [key])
    if (key.rows.length) return await getAsync(`avatar:${key.rows[0].user_id}`)
  }
  return 'default.png'
}

const fs = require('fs')
const {AVATAR_PATH} = require('../config/basic')
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
