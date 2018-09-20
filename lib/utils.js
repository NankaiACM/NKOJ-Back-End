const crypto = require('crypto');
const utils = {};

utils.splitEmail = email => {
  const arr = email.toLowerCase().split('@');
  const suffix = arr.pop();
  const prefix = arr.join('@');
  return {prefix, suffix};
};

utils.md5 = string =>
    crypto.createHash('md5').update(string).digest('hex');

module.exports = utils;
