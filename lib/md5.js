const crypto = require('crypto')
const md5 = (string) => {
  'use strict'
  return crypto.createHash('md5').update(string).digest('hex')
}

module.exports = md5
