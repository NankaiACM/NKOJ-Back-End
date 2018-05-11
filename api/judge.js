const router = require('express').Router()
const fs = require('fs')
const db = require('../database/db')
const ws = require('ws')
const {SOLUTION_PATH, DATA_BASE} = require('../config/basic')
const {require_perm} = require('../lib/permission')

// TODO: 太魔法了
router.post('/', require_perm(), async (req, res) => {
  'use strict'
  const problem = req.body.pid
  const lang = 1
  const code = req.body.code
  const user = req.session.user
  const ip = req.ip
  let ipaddr_id = ''

  const queryString = 'INSERT INTO solutions (user_id, problem_id, language, ipaddr_id, status_id)' +
    ' VALUES ($1, $2, $3, $4, 1) RETURNING solution_id'
  let ipquery = 'SELECT * FROM ipaddr WHERE ipaddr = $1'

  let result = await db.query(ipquery, [ip])
  if (result.rows.length > 0) {
    ipaddr_id = result.rows[0].ipaddr_id
  } else {
    ipquery = 'INSERT INTO ipaddr (ipaddr) VALUES ($1) RETURNING ipaddr_id'
    result = await db.query(ipquery, [ip])
    ipaddr_id = result.rows[0].ipaddr_id
  }
  let langString = 'cpp'
  db.query(queryString, [user, problem, lang, ipaddr_id]).then(suc => {
    const solution_id = suc.rows[0].solution_id
    if (!fs.existsSync(`${SOLUTION_PATH}/${solution_id}`)) fs.mkdirSync(`${SOLUTION_PATH}/${solution_id}`)
    if (!fs.existsSync(`${SOLUTION_PATH}/${solution_id}/temp`)) fs.mkdirSync(`${SOLUTION_PATH}/${solution_id}/temp`)
    if (!fs.existsSync(`${SOLUTION_PATH}/${solution_id}/exec`)) fs.mkdirSync(`${SOLUTION_PATH}/${solution_id}/exec`)
    if (!fs.existsSync(`${SOLUTION_PATH}/${solution_id}/cmperr`)) fs.mkdirSync(`${SOLUTION_PATH}/${solution_id}/cmperr`)
    if (!fs.existsSync(`${SOLUTION_PATH}/${solution_id}/execout`)) fs.mkdirSync(`${SOLUTION_PATH}/${solution_id}/execout`)
    if (!fs.existsSync(`${SOLUTION_PATH}/${solution_id}/diff`)) fs.mkdirSync(`${SOLUTION_PATH}/${solution_id}/diff`)
    if (!fs.existsSync(`${SOLUTION_PATH}/${solution_id}/codes`)) fs.mkdirSync(`${SOLUTION_PATH}/${solution_id}/codes`)
    if(fs.existsSync(`${SOLUTION_PATH}/${solution_id}/codes`))
    fs.open(`${SOLUTION_PATH}/${solution_id}/codes/${solution_id}.${langString}`, "w", err => {
      if (err) {
        throw err
      }
      else {
        fs.writeFile(`${SOLUTION_PATH}/${solution_id}/codes/${solution_id}.${langString}`, code, err => {
          if (!err) {
            const webstorm = new ws('ws://127.0.0.1:8888')
            webstorm.on('open', function open() {
              webstorm.send(DATA_BASE + "/")
              webstorm.send(solution_id)
              webstorm.send(problem)
              webstorm.send('1')
              webstorm.send('1001')
              webstorm.send('2560000')
              webstorm.send('1')
              webstorm.send('0')
              webstorm.send('1')
            })
            webstorm.on('close', function close() {
              fs.readFile(`${SOLUTION_PATH}/${solution_id}/temp/${solution_id}_error`, "utf-8", (err, data) => {
                if (err) return res.fail(2, err)
                else return res.ok(data)
              })
              fs.readFile(`${SOLUTION_PATH}/${solution_id}/temp/${solution_id}_result`, "utf-8", (err, data) => {
                if (err) throw err
                else {
                  const alterString = "UPDATE solutions SET status_id = $1 WHERE solution_id = $2"
                  db.query(alterString, [data, solution_id])
                }
              })
            })
            //return res.ok('Submit Successfully!')
          }
          else throw err
        })
      }
    })
  }, err => {
    throw err
  })
})

module.exports = router
