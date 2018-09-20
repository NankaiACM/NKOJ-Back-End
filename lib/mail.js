// noinspection SpellCheckingInspection
const nodemailer = require('nodemailer');
const redis = require('$lib/redis')('mail');
const validator = require('validator');
const {splitEmail, md5} = require('$lib/utils');
const {BASE_URL} = require('$config/path');
const mailTemplate = require('$config/mailTemplate');

// DEV: Send Email
const transporter = nodemailer.createTransport(
    require('$config/mail').transporter
);

// DEV: Email Type
const mailOptions = require('$config/mail').regMailOptions;

const convertToHash = email =>
  md5(Buffer.from(email).toString('base64') + new Date);


const register = (to, code, link, callback) => {
  to = to.toLowerCase();
  if (!validator.isEmail(to))
    callback({success: false, error: 'not valid email'});
  const {suffix} = splitEmail(to);
  return redis.set(suffix, 1, 'NX', 'EX', 30, (err, rep) => {
    if (err) return callback({success: false, error: err});
    if (!rep) return callback({
      success: false,
      error: 'sorry, we can only send to that server once every 30 second'
    });

    redis.get(`banned:${to}`, (err, res) => {
      if (res)
        return callback({
          success: false, error: 'this email has been blocked.'
        });
      const hash = convertToHash(to);
      redis.set(hash, to, 'NX', 'EX', 172000);
      const arg = {
        text: `Your Code is: ${code} .\n Or you can use this link: ${link}`,
        html: mailTemplate(code, link, BASE_URL, hash, to),
        to: to
      };
      transporter.sendMail(Object.assign(mailOptions, arg), (error, info) => {
        if (error) return callback({success: false, error: error});
        return callback({success: true, info: info})
      })
    })
  })
};

const banEmail = (hash, email, unban, cb) => {
  email = email.toLowerCase();
  if (unban) {
    redis.del(`banned:${email}`, 1);
    cb({ success: true })
  }
  else redis.get(hash, (err, res) => {
    if (res === email) {
      redis.set(`banned:${email}`, 1);
      cb({ success: true })
    } else {
      cb({
        success: false, error: 'cannot find the key, the TTL is 2 days, sorry.'
      })
    }
  })
};

module.exports = {
  sendVerificationMail: register,
  banEmail: banEmail
};
