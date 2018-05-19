const router = require('express').Router()

const db = require('../../database/db')
const validator = require('validator')

router.get('/check/:type/:what', async (req, res, next) => {
  'use strict'
  const type = req.params.type
  const value = req.params.what
  if (type === 'email') {
    if (validator.isEmail(value)) {
      const result = await db.checkEmail(value)
      if (result) return res.fail(422, result)
      return res.ok()
    }
  } else if (type === 'nickname') {
    // TODO: merge with fc
    if (value.length >= 3 && value.length <= 20 && !validator.isNumeric(value) && !validator.isEmail(value)) {
      const result = await db.checkName(value)
      if (result) return res.fail(422, result)
      return res.ok()
    }
  }
  return res.fail(422)
})

module.exports = router
