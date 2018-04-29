const router = require('express').Router()
const fs = require('fs')
const db = require('../database/db')
const ws = require('ws')
const {SOLUTION_PATH} = require('../config/basic')
Date.prototype.format = require('../lib/dateFormat')

router.get('/', async (req, res) => {
  'use strict'
  const webstorm = new ws('ws://192.168.99.100:8000')
  webstorm.on('open', function open() {
    webstorm.send('./')
    webstorm.send('1')
    webstorm.send('1001')
    webstorm.send('0')
    webstorm.send('1000')
    webstorm.send('2560000')
    webstorm.send('3')
    webstorm.send('0')
    webstorm.send('1')
  })
  webstorm.on('close', function close() {
    res.ok('!!!')
  })
  /*
  if(!req.session.user) return res.fatal(401)
  const problem = req.body.p
  const lang = req.body.lang
  const code = req.body.code
  const user = req.session.user
  const ip = req.ip
  let ipaddr_id = ''

  const queryString = 'INSERT INTO solutions (user_id, problem_id, language, ipaddr_id)' +
    ' VALUES ($1, $2, $3, $4) RETURNING solution_id'
  let ipquery = 'SELECT * FROM ipaddr WHERE ipaddr = $1'

  let result = await db.query(ipquery, [ip])
  if(result.rows.length > 0){
    ipaddr_id = result.rows[0].ipaddr_id
  } else {
    ipquery = 'INSERT INTO ipaddr (ipaddr) VALUES ($1) RETURNING ipaddr_id'
    result = await db.query(ipquery, [ip])
    ipaddr_id = result.rows[0].ipaddr_id
  }
  let langString = 'cpp'
  db.query(queryString, [user, problem, lang, ipaddr_id]).then(suc => {
    fs.writeFile(`${SOLUTION_PATH}/${suc.rows[0].solution_id}.${langString}`, code, err => {
      if(!err) return res.ok('Submit Successfully!')
      else return res.fail(2, err)
    })
  }, err => {
    res.fail(1, err)
  })*/
})

module.exports = router
