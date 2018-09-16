const crypto = require('crypto');
const db = require('../database/db');
const session = require('./session');

module.exports = (req, res, next) => {
  const {key, secret} = {
    key: req.body.api_key || req.query.api_key || undefined,
    secret: req.body.api_secret || req.query.api_secret || undefined
  };
  if (!key || !secret) return session(req, res, next);

  const hash = crypto.createHash('sha256');
  hash.update(`${key}${secret}`);
  const hashed_key = hash.digest('hex');

  db.query('SELECT * FROM user_api WHERE api_key = $1 and api_hashed = $2',
      [key, hashed_key]).then(function(ret) {
    if (!ret.rows.length) return res.fail(401, 'api key is not recognized');
    req.session = {};
    req.session.user = ret.rows[0].user_id;
    next();
  }).catch(function(e) {
    next(e);
  });
};
