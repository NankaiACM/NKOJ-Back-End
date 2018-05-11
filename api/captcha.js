const router = require('express').Router()
const captcha = require('../lib/captcha')

router.get('/:type*?', (req, res) => {
  'use strict'
  return captcha.middleware(req.params.type)(req, res)
})

module.exports = router
