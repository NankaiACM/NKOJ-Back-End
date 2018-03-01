const nodemailer = require('nodemailer')
const fs = require('fs')

// DEV: Send Email
let transporter = nodemailer.createTransport({
  host: '*',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: '*',
    pass: '*'
  }
})

const html = '<!DOCTYPE html><html><head></head><body>Your Code is: *</body></html><'

let mailOptions = {
  from: '*',
  to: '*',
  subject: 'Online Judge Email Verification',
  text: 'Your Code is: *', // plain text body
  html: html // html body
}

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log(error)
  }
  console.log('Message sent: %s', info.messageId)
})

module.exports = transporter.sendMail
