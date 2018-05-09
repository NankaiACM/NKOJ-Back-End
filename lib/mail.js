// noinspection SpellCheckingInspection
const nodemailer = require('nodemailer')
const redis = require('redis')
const check = require('./old-form-check')
const db = require('../database/db')
const client = redis.createClient()
const {DB_EMAIL_VERIFY} = require('../config/redis')
const md5 = require('../lib/md5')
const {BASE_URL} = require('../config/path')
const mailTemplate = require('../config/mailTemplate')
client.select(DB_EMAIL_VERIFY)

// DEV: Send Email
const transporter = nodemailer.createTransport(require('../config/mail').transporter)

const mailOptions = require('../config/mail').regMailOptions

const convertToHash = (email) => {
  'use strict'
  return md5(Buffer.from(email).toString('base64') + new Date)
}

const register = (to, code, link, callback) => {
  'use strict'
  to = to.toLowerCase()
  if (check(['email'], [to])) callback({ success: false, error: 'not valid email' })
  const email_suffix = db.splitEmail(to)[1]
  return client.set(email_suffix, 1, 'NX', 'EX', 30, (err, rep) => {
    if (err) return callback({success: false, error: err})
    if (!rep) return callback({success: false, error: 'sorry, we can only send to that server once every 30 second'})

    client.get(`banned:${to}`, (err, res) => {
      if (res) return callback({success: false, error: 'this email has been banned by user.'})
      const hash = convertToHash(to)
      client.set(hash, to, 'NX', 'EX', 172000)
      const arg = {
        text: `Your Code is: ${code} .\n Or you can use this link: ${link}`,
        html: mailTemplate(code, link, BASE_URL, hash, to),
        to: to
      }
      transporter.sendMail(Object.assign(mailOptions, arg), (error, info) => {
        if (error) return callback({success: false, error: error})
        return callback({success: true, info: info})
      })
    })
  })
}

const banEmail = (hash, email, unban, cb) => {
  'use strict'
  email = email.toLowerCase()
  if (unban) {
    client.del(`banned:${email}`, 1)
    cb({ success: true })
  }
  else client.get(hash, (err, res) => {
    if (res === email) {
      client.set(`banned:${email}`, 1)
      cb({ success: true })
    } else {
      console.log(email, res)
      cb({ success: false, error: 'cannot find the key, the TTL is 2 days, sorry.' })
    }
  })
}

module.exports = {
  sendVerificationMail: register,
  banEmail: banEmail
}
