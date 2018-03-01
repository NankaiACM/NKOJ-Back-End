const router = require('express').Router()
const path = require('path')

const db = require(path.join(__dirname, '../database', 'db'))

router.post('/', (req, res) => {
  'use strict'
  console.log(req.body)
  db.query(req.body.query, [])
    .then(() => res.json({code: 200, message: 'ok', query: req.body.query}))
    .catch(err => res.json({code: 500, message: 'error in database', err: err.stack.split('\n')[0]}))
})

router.get('/', (req, res) => {
  'use strict'

})

module.exports = router
