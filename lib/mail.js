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

const register = (to, code, link) => {
  return new Promise(async resolve => {
    to = to.toLowerCase();
    if (!validator.isEmail(to))
      return resolve({
        success: false, error: 422
      });

    // TODO: receive email
    let ret = await redis.set(to, 1, 'NX', 'EX', 10 * 60);

    if(!ret) return resolve({
      success: false, error: 429
    });

    ret = await redis.get(`banned:${to}`);

    if(ret) return resolve({
      success: false, error: 403
    });

    const args = {
      text: `Use this link: ${link} to verify your email`,
      html: mailTemplate(link, BASE_URL, to),
      to
    };

    transporter.sendMail({...mailOptions, ...args}, (error, info) => {
      if (error) return resolve({success: false, error: error});
      return resolve({success: true, info: info})
    })
  });
};

module.exports = {
  sendVerificationMail: register,
};
