const router = require('express').Router()

const db = require('../database/db')
const check = require('../lib/form-check')

router.get('/check/:type/:what', async (req, res, next) => {
  'use strict'
  const type = req.params.type
  const value = req.params.what
  let result
  if (type === 'email') {
    if (!(result = check([type], [value]))) {
      const result = await db.checkEmail(value)
      if (result) res.fail(1, result)
      else res.ok()
    } else res.fail(1, result)
  } else if (type === 'nickname') {
    if (!(result = check([type], [value]))) {
      const result = await db.checkName(value)
      if (result) res.fail(1, result)
      else res.ok()
    } else res.fail(1, result)
  } else next()
})

module.exports = router
