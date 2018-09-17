const pool = require('$db/init');
const session = require('$lib/session');
const index = {};

index.pool = () => pool;

index.query = (text, params) => {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    pool.query(text, params, (err, res) => {
      const end = Date.now() - start;
      if (err) {
        console.log(`Database query [${text}, ${params}] failed in ${end} ms`);
        console.log(err);
        reject(err);
      } else {
        console.log(`Database query [${text}, ${params}] finished in ${end} ms`);
        resolve(res);
      }
    });
  });
};

index.splitEmail = email => {
  'use strict';
  const arr = email.toLowerCase().split('@');
  const a = arr.pop();
  const b = arr.join('@');
  return [b, a];
};

index.postLogin = (info, req, res) => {
  'use strict';
  req.session.user = info.user_id;
  req.session.permission = info.perm;
  req.session.nickname = info.nickname;
  req.session.save();
  delete info.password;
  session.login(info.user_id, req.session.id);
  res.ok(info);
};

index.checkName = async (name) => {
  let result = await index.query(
      'SELECT nick_id FROM user_nick WHERE lower(nickname) = lower($1) LIMIT 1',
      [name]);
  if (result.rows.length > 0) {
    result = await index.query(
        'SELECT user_id FROM user_info WHERE nick_id = $1 LIMIT 1',
        [result.rows[0].nick_id]);
    if (result.rows.length > 0) return [
      {
        name: 'nickname',
        message: 'is being used',
      }];
    return [{name: 'nickname', message: 'has been used'}];
  }
  return false;
};

index.checkEmail = async (email) => {
  const result = await index.query(
      'SELECT nickname FROM users WHERE email = lower($1) LIMIT 1', [email]);
  if (result.rows.length > 0) {
    const nickname = result.rows[0].nickname;
    return [{name: 'email', message: `taken by someone like ${nickname}`}];
  }
  return false;
};

index.joinQueryArr = (key) => {
  'use strict';
  const arr = [];
  arr.push(key.join(', '));
  arr.push(arr.map(function(k, i) {return '$' + (i + 1);}).join(','));
  return arr;
};

module.exports = index;
