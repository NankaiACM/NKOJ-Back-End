const crypto = require('crypto');
const db = require('$db');
const session = require('$lib/session');

module.exports = (req, res, next) => {
  let _key, _sign;
  if(req.headers['authorization']) {
    [_, _key, _sign] = req.headers['authorization'].split(' ');
    if(_.toLowerCase() !== 'Negotiate'.toLowerCase())
      return res.fail(401, 'unknown authorization type: ' + _);
  }

  const {key, secret} = {
    key: req.body._key || req.query._key || _key,
    secret: req.body._sign || req.query._sign || _sign
  };

  if (!key || !secret)
    return session(req, res, next);
  else if (key.length !== 12 || secret.length !== 24) {
    return res.fail(401, 'api key or sign is wrongly formed');
  }

  const hash = crypto.createHash('sha256');
  hash.update(`${key}${secret}`);
  const hashed_key = hash.digest('hex');

  db.only('SELECT user_id as uid, enabled FROM user_api WHERE api_key = $1 and api_hashed = $2',
      [key, hashed_key]).then(function({uid, enabled}) {
    if (!uid) return res.fail(401, 'api key is not recognized');
    if (!enabled) return res.fail(401, 'api key is not available');
    req.session = {};
    req.session.user = uid;
    next();
  }).catch(function(e) {
    next(e);
  });
};
