const router = require('express').Router()
const db = require('./db')
const fs = require('fs')
const redis = require('redis')
const client = redis.createClient(6379, '127.0.0.1', {})
const {DB_PROBLEM} = require('../config/redis')
const {promisify} = require('util')
const setAsync = promisify(client.set).bind(client)
const getAsync = promisify(client.get).bind(client)
const multer = require('multer')
const path = require('path')
const md5 = require('../lib/md5')
client.select(DB_PROBLEM)

router.get('/initProblems', async (req, res)  => {
  for (let i = 1001; i <= 1020; i++) {
    client.set('problem:' + i, i + '.md')
    let result = await db.query('SELECT * FROM problems WHERE problem_id = $1', [i])
    if(result.rows.length > 0) continue
    await db.query('INSERT INTO problems (problem_id, title) VALUES ($1, $2)', [i, i + '_problems'])
  }
  for (let i = 1001; i <= 1020; i++) {
    client.get('problem:' + i, redis.print)
  }
  res.ok(0, 'Success Init!')
})

module.exports = router