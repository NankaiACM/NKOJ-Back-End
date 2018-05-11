const crypto = require('crypto')

const key_public = require('../config/rsa').key_public
const key_private = require('../config/rsa').key_private

const decrypt = function (message) {
  try {
    return crypto.privateDecrypt({
      key: key_private,
      padding: crypto.RSA_PKCS1_OAEP_PADDING
    }, Buffer.from(message, 'base64')).toString()
  } catch (e) {
    return false
  }
}

const encrypt = function (message) {
  try {
    return crypto.publicEncrypt({
      key: key_public,
      padding: crypto.RSA_PKCS1_OAEP_PADDING
    }, Buffer.from(message)).toString('base64')
  } catch (e) {
    return false
  }
}

module.exports = {
  decrypt,
  encrypt
}
