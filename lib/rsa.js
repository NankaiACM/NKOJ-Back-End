const crypto = require('crypto');
const jsdecrypt = require('jsdecrypt');

const {key_public, key_private} = require('$config/rsa');

const decrypt = function(message) {
  try {
    return jsdecrypt.dec(key_private, message);
  } catch (e) {
    try {
      return crypto.privateDecrypt({
        key: key_private,
      }, Buffer.from(message, 'base64')).toString();
    } catch (e) {
      return false;
    }
  }
};

const encrypt = function(message) {
  try {
    return crypto.publicEncrypt({
      key: key_public,
    }, Buffer.from(message)).toString('base64');
  } catch (e) {
    return false;
  }
};

const algorithm = 'aes-256-ctr';
const password = key_private.substr(40, 7);


const simpleDecrypt = function(message) {
  const cipher = crypto.createCipher(algorithm, password);
  return Buffer.concat([cipher.update(Buffer.from(message,'base64')),cipher.final()]).toString();
};

const simpleEncrypt = function(message) {
  const cipher = crypto.createCipher(algorithm, password);
  return Buffer.concat([cipher.update(Buffer.from(message)),cipher.final()]).toString('base64');
};

module.exports = {
  decrypt,
  encrypt,
  simpleDecrypt,
  simpleEncrypt
};
