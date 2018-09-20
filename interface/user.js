const db = require('$db');
const crypto = require('crypto');
const session = require('$lib/session');

const query = async function(options) {
  const {user, nickname, email, password} = options;
  if (nickname) {
    let {nick_id} = await db.only(
        'SELECT nick_id FROM user_nick WHERE lower(nickname) = lower($1) LIMIT 1',
        [nickname]);
    if (nick_id) {
      const {user_id} = await db.only(
          'SELECT user_id FROM user_info WHERE nick_id = $1 LIMIT 1',
          [nick_id]);
      return user_id || -1;
    }
    return false;
  }
  if (email) {
    const {user_id} = await db.only(
        'SELECT user_id FROM users WHERE email = lower($1) LIMIT 1', [email]);
    return user_id || 0;
  }
  if (user && password) {
    const query = 'SELECT * FROM users WHERE (lower(nickname) = $1 OR email = $1) AND password = hash_password($2) LIMIT 1';
    const row = await db.find(query, [user, password]);
    if(!row) return false;
    const {password, old_password, ...info} = row;
    return info;
  }
};

const login = (req, user) => {

};

const info = async function(uid) {
  const result =
      await db.query('SELECT * FROM users WHERE user_id = $1', [uid]);
  const ac = await db.query(
      `with t as (
  select distinct problem_id, status_id from solutions where user_id = $1
) select ARRAY((select distinct problem_id from t where status_id = 107)) as ac,
ARRAY((select distinct problem_id from t)) as all`, [uid]);

  let row = result.rows[0];
  let {password, old_password, ...ret} = row;
  return {...ret, ...ac.rows[0]};
};

const logout = (req) => {
  const user = req.session.user;
  const id = req.session.id;
  session.logout(user, id);
  delete req.session;
};

const logoutAll = (req) => {
  const user = req.session.user;
  session.logoutAll(user);
  delete req.session;
};

const insert = (info) => {

};

const update = () => {

};

const remove = () => {

};

const addToGroup = () => {

};

const removeFromGroup = () => {

};

const adjustGroup = () => {

};

const sendVerificationMail = () => {

};

const setEmailVerified = () => {

};

const setEmailUnverified = () => {

};

const setIdentityVerified = () => {

};

const listApi = async (user) => {
  const {rows} = await db.query('SELECT api_name, api_key, enabled, since FROM user_api WHERE user_id = $1', [user]);
  return rows;
};

const generateApi = async (user, name) => {
  const {apis} =
      await db.only('SELECT count(*) as apis FROM user_api WHERE user_id = $1', [user]);
  if (apis >= 3)
  // TODO: extract strings ERR_TOO_MANY_APIKEY
    return res.fail(1, 'You have had too many api keys...');

  let key , secret;

  try {
    key = crypto.randomBytes(16).toString('hex');
    secret = crypto.randomBytes(24).toString('hex');
  } catch (e) {
    return {success: false, error: e}
  }

  const hash = crypto.createHash('sha256').update(`${key}${secret}`);
  const hashed = hash.digest('hex');

  try {
    await db.query('insert into user_api(user_id, api_key, api_hashed, api_name) values ($1, $2, $3, $4)', [user, key, hashed, name])
  } catch (e) {
    return {success: false, retry: true};
  }

  return {success: true, key, secret};
};

const operateApi = (op) => async (user, key, name) => {
  const params = [key, user];
  switch (op) {
    case 'enable':
    case 'disable':
      return await db.find(
          `UPDATE user_api SET enabled = ${op === 'enable'
              ? 'TRUE'
              : 'FALSE'} WHERE api_key = $1 AND user_id = $2 RETURNING enabled`
          , params);
    case 'remove':
      return await db.find('DELETE FROM user_api WHERE api_key = $1 AND user_id = $2 RETURNING *', params);
    case 'rename':
      return await db.find('UPDATE user_api SET api_name = $1 WHERE api_key = $2 AND user_id = $3 returning api_name, api_key, enabled', [name, key, user]);
    default:
      throw 'unknown operation';
  }
};

module.exports = {
  info,
  query,
  login,
  logout,
  logoutAll,
  api: {
    list: listApi,
    generate: generateApi,
    enable: operateApi('enable'),
    disable: operateApi('disable'),
    remove: operateApi('remove'),
    rename: operateApi('rename'),
  }
};
