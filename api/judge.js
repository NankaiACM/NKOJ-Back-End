const router = require('express').Router()

const fs = require('fs')
const {solution_path} = require('../config/path')

router.post('/', (req, res) => {
  'use strict'
  const problem = req.body.p
  const lang = req.body.lang
  const code = req.body.code
  console.log(req.query)

  fs.writeFile(`${solution_path}/${problem}.cpp`, code, (err) => {
    console.log(err)
    console.log(fs.readFileSync(`${solution_path}/${problem}.cpp`).toString())
  })

  res.end()

})

module.exports = router
