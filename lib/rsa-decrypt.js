const crypto = require('crypto')

// Dev: Develop Keys
const key_public = '-----BEGIN PUBLIC KEY-----\n' +
  'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDiPDf8ep0cgjLUbIx6rCOQS4ct\n' +
  '0KpRbgmJUyVCqCxhfhAyNvtnpShsN7bIRA+Wpx79LOm2zpfZb8LzzP90q+boUcP2\n' +
  'VmZ2nd+hPD525dCQcerxQ6ywSmKqjXsu2Nivw7NFq1f+CsfPjizCOgyccK7rkWvx\n' +
  'DsKYI31akTRLvVkONwIDAQAB\n' +
  '-----END PUBLIC KEY-----\n'

const key_private = '-----BEGIN RSA PRIVATE KEY-----\n' +
  'MIICXQIBAAKBgQDiPDf8ep0cgjLUbIx6rCOQS4ct0KpRbgmJUyVCqCxhfhAyNvtn\n' +
  'pShsN7bIRA+Wpx79LOm2zpfZb8LzzP90q+boUcP2VmZ2nd+hPD525dCQcerxQ6yw\n' +
  'SmKqjXsu2Nivw7NFq1f+CsfPjizCOgyccK7rkWvxDsKYI31akTRLvVkONwIDAQAB\n' +
  'AoGAHkuCE8U3lMG6nMeMaED04jW6/F+c7xqVHFaN/scWale/Q3opYE+1gghT6a1z\n' +
  'iPEILU7+XQR9QRi+OneRHcaHPQR+u6F94K2m8qqypBMVY1MpCXWz3W9dcXftp217\n' +
  'w8JyfNv4ybgRFbXo2aq3aeS/imsjmkRKTWEiIh0qMqg8soECQQD1aypo6OiltHnF\n' +
  '70tVRVop2Fl2YLUViKFiZvrNJWYFxutI+TNCEPzv/7FolCzYx7/67ED3LKe4pltR\n' +
  'XcbJah7ZAkEA6/1QeMO71s73V1m1FQ09929WQ3T2Nir9HCtTOZRyofiCGdzgOoOM\n' +
  'K96q97Xo0jO85TM4YTICwLtdjH0lb6KLjwJBAMIGoLfic5QWNDQFtNRMiTUOA+Sw\n' +
  'HlpQ8+5dJimsSJWGp5vA0QKJdb+0sijRBQe6HJCf2djQ6CT2+LlCX5f7mzkCQQCT\n' +
  'ZrMn62JdhwLZba/8yTumXMWt9tV++hUEzk76jS2Y2+cvjlYEVnxsPnXdqaMWALkB\n' +
  'FKAnnZw4lA+Xm+eRNh8jAkA4MZ6GVO2bJEc3NPhoFoZNCTO7FlFQC3CZdHmZdmOp\n' +
  'jswK3xZoLjyHeTuA8ii9BquHxEt1nlplUQTMSFEZOgnJ\n' +
  '-----END RSA PRIVATE KEY-----\n'

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

module.exports = decrypt
