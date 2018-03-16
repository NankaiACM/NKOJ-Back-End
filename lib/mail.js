// noinspection SpellCheckingInspection
const nodemailer = require('nodemailer')
const redis = require('redis')
const check = require('./form-check')
const db = require('../database/db')
const client = redis.createClient()
const {DB_EMAIL_VERIFY} = require('../config/redis')
const md5 = require('../lib/md5')
const {BASE_URL} = require('../config/basic')
client.select(DB_EMAIL_VERIFY)

// DEV: Send Email
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: 'sunrisefox@qq.com',
    pass: 'mpbbeqmsqtkubdij'
  }
})

const mailOptions = {
  from: 'SunriseFox <sunrisefox@qq.com>',
  subject: 'Online Judge Email Verification'
}

const convertToHash = (email) => {
  'use strict'
  return md5(Buffer.from(email).toString('base64') + new Date)
}

const register = (to, code, link, callback) => {
  'use strict'
  to = to.toLowerCase()
  if (check(['email'], [to])) callback({success: false, error: 'not valid email'})
  const email_suffix = db.splitEmail(to)[1]
  return client.set(email_suffix, 1, 'NX', 'EX', 60, (err, rep) => {
    if (err) return callback({success: false, error: err})
    if (!rep) return callback({success: false, error: 'sorry, we can only send to that server once a minute'})

    client.get(`banned:${to}`, (err, res) => {
      if (res) return callback({success: false, error: 'this email has been banned by user.'})
      const hash = convertToHash(to)
      client.set(hash, to, 'NX', 'EX', 172000)
      const arg = {
        text: `Your Code is: ${code} .\n Or you can use this link: ${link}`,
        html: `<!DOCTYPE html><html><head><title>Online Judge Verification</title></head><body>Your Code is: <span style="color: red"> ${code} </span> <br>Or use this link: <a href="${link}"> ${link} </a> <br> Please note the TTL is 10 minutes. <hr> If you never register in our website and no longer want to receive our email, click this link: <a href="${BASE_URL}/api/u/unsubscribe/${hash}/${Buffer.from(to).toString('base64')}">Unsubscribe</a></body></html>`,
        to: to
      }
      transporter.sendMail(Object.assign(mailOptions, arg), (error, info) => {
        if (error) return callback({success: false, error: error})
        client.set()
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
    cb({success: true})
  }
  else client.get(hash, (err, res) => {
    if (res === email) {
      client.set(`banned:${email}`, 1)
      cb({success: true})
    } else {
      console.log(email, res)
      cb({success: false, error: 'cannot find the key, the TTL is 2 days, sorry.'})
    }
  })
}

module.exports = {
  sendVerificationMail: register,
  banEmail: banEmail
}

// 退订 email
// 更新数据
// 头像
