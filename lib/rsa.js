const crypto = require('crypto')
const jsdecrypt = require('jsdecrypt')
const forge = require('node-forge')
const key_public = require('../config/rsa').key_public
const key_private = require('../config/rsa').key_private
const key_public2 = require('../config/rsa').key_public2

const decrypt = function (message) {
  try {
    return jsdecrypt.dec(key_private, message)
  } catch (e) {
    try {
      return crypto.privateDecrypt({
        key: key_private
      }, Buffer.from(message, 'base64')).toString()
    } catch (e) {
      return false
    }
  }
}

const encrypt = function (message) {
  try {
    return crypto.publicEncrypt({
      key: key_public
    }, Buffer.from(message)).toString('base64')
  } catch (e) {
    return false
  }
}

const genRawStr = function (len) {
  if (!Number.isFinite(len)) {
    throw new TypeError('Expected a finite number');
  }
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

const getPass = function (raw) {
  const publicKey = forge.pki.publicKeyFromPem(key_public2)
  const encrypted = publicKey.encrypt(raw)
  return forge.util.encode64(encrypted)
}

module.exports = {
  decrypt,
  encrypt,
  genRawStr,
  getPass
}
