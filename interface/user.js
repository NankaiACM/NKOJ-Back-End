const db = require('$db');
const crypto = require('crypto');
const sessionInterface = require('$interface/session');
const redis = require('$lib/redis')('user');
const fs = require('fs');
const {AVATAR_PATH} = require('$config');
const {simpleEncrypt, simpleDecrypt} = require('$lib/rsa');
const {check_limit, apply_limit} = require('$lib/rate-limit');

const mail = require('$lib/mail');

// TODO... admin...

const query = async function(options) {
  const {user, nickname, email, password} = options;
  if (nickname) {
    let {nick_id, user_id} = await db.only(
        'SELECT nick_id, user_id FROM user_nick WHERE lower(nickname) = lower($1) LIMIT 1',
        [nickname]);
    if (nick_id) {
      const {uid} = await db.only(
          'SELECT user_id as uid FROM user_info WHERE nick_id = $1 LIMIT 1',
          [nick_id]);
      return uid === user_id ? user_id : -user_id;
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
    { // password is not defined...
      const {password, old_password, ...info} = row;
      return info;
    }
  }
};

const login = async (req, row) => {
  const {nickname, user_id} = row;
  sessionInterface.login(req, {user_id, nickname})
};

const info = async function(uid, fields) {

  let ac;
  if(!fields) {
    ac = await db.find(
        `with t as (
  select distinct problem_id, status_id from solutions where user_id = $1
) select ARRAY((select distinct problem_id from t where status_id = 107)) as ac,
ARRAY((select distinct problem_id from t)) as all`, [uid]);
  }

  fields = fields || '*';
  fields = Array.isArray(fields) ? fields : [fields];
  fields = fields.join(', ');

  const result =
      await db.find(`SELECT ${fields} FROM users WHERE user_id = $1`, [uid]);

  if(!result) return {error: 'not found'};
  let {password, old_password, ...ret} = result;
  return {...ret, ...ac};
};

const logout = (req) => {
  const user = req.session.user;
  const id = req.session.id;
  sessionInterface.logout(user, id);
  delete req.session;
};

const logoutAll = (req) => {
  const user = req.session.user;
  sessionInterface.logoutAll(user);
  delete req.session;
};

const add = async (req, info) => {
  const {nickname, password, email, school, gender} = info;
  const ip = req.ip;

  if (await query({nickname}))
    return {success: false, error: 'nickname'};

  if (await query({email}))
    return {success: false, error: 'email'};

  const row = await db.find('INSERT INTO users (nickname, password, email, gender, school, ipaddr) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [
    nickname,
    password,
    email,
    gender || 0,
    school,
    ip]);

  return {success: row !== false, row}
};


const remove = () => {

};

const groups = {
  default: 1,
  emailVerified: 2,
  muted: 3,
  banned: 4,
  identityVerified: 5,
  superAdmin: 6,
};

const checkGroup = (role, what) => {
  if(what in groups)
    return role.includes(groups[what]);
  return false;
};

const operateGroup = async (type, uid, group) => {
  await sessionInterface.invalidatePermission(uid);
  if(type === 'add' || type === 'remove') {
    if(!group in groups) return false;
    const role_id = groups[group];
    let {roles} = await db.only(`SELECT user_role as roles FROM user_info WHERE user_id = $1`, [uid]);
    roles = roles.filter(i => i !== role_id);
    if(type === 'add')
      roles.push(role_id);
    const ret = await db.find(`UPDATE user_info SET user_role = $1 WHERE user_id = $2 RETURNING *`, [`{${roles.join(', ')}}`, uid]);
    return ret !== false;
  } else if (type === 'adjust') {
    const ret = await db.find(`UPDATE user_info SET user_role = $1 WHERE user_id = $2 RETURNING *`, [`{${group.join(', ')}}`, uid]);
    return ret !== false;
  }
  return false;
};

const addToGroup = (uid, group) => {
  return operateGroup('add', uid, group);
};

const removeFromGroup = (uid, group) => {
  return operateGroup('remove', uid, group);
};

const adjustGroup = async (uid, role) => {
  return operateGroup('adjust', uid, role);
};

const emailToVerify = async (uid) => {
  const {email, role} =
      await db.only('SELECT email, role FROM users WHERE user_id = $1', [uid]);
  if(checkGroup(role, 'emailVerified')) return false;
  return email;
};

const sendVerificationEmail = (req) => {
  const uid = req.session.user;
  const key = `email:${uid}`;
  return new Promise(async resolve => {
    await redis.del(key);
    const email = await emailToVerify(uid);
    if(!email) return resolve({success: false, error: 'already verified'});

    const code = Math.floor(Math.random() * 900000) + 100000;
    await redis.hset(key, email, code);
    await redis.expire(key, 60 * 60);

    const hash = simpleEncrypt(email);
    // TODO: fix
    let link = new URL(`http://${req.hostname}/api/u/verify/email`);
    link.searchParams.set('hash', hash);
    link.searchParams.set('code', code);
    link = link.href;

    const result = await mail.sendVerificationMail(email, code, link);
    if (result.success)
      await apply_limit('sendmail', req);
    else
      await redis.del(key);
    resolve(result);
  });
};

const verifyEmail = async (params) => {
  const {hash, code} = params;
  const email = simpleDecrypt(hash);
  const {uid} = await db.find('SELECT user_id as uid FROM users WHERE email = $1', [email]);
  if(!uid) return false;
  const key = `email:${uid}`;
  const result = await redis.hget(key, email);
  if(result === code) {
    await redis.del(key);
    await db.find('UPDATE user_info SET email_old = null WHERE user_id = $1', [uid]);
    await addToGroup(uid, 'emailVerified');
    return true;
  }
  return false;
};

const updateEmail = async (req, email) => {
  const uid = req.session.user;
  const {oldEmail, role} = await db.only('SELECT email as oldEmail, role FROM users WHERE user_id = $1', [uid]);
  if(checkGroup(role, 'emailVerified')) {
    await removeFromGroup(uid, 'emailVerified');
    await db.only('UPDATE user_info SET email_old = $1 WHERE user_id = $2',
        [oldEmail, uid]);
  }
  await db.find('UPDATE users SET email = $1 WHERE user_id = $2 RETURNING *', [email, uid]);
  return sendVerificationEmail(req);
};

const update = async (req, info) => {
  const {nickname, email, gender, qq, phone, real_name, school, password, words} = info;
  const emailRow = {};
  // TODO: email logic;
  if(email && !await check_limit('sendmail')(req)) {
    if (await query({email}))
      return {success: false, error: 'email'};
    const ret = await updateEmail(req, email);
    if(ret) emailRow.email = email;
  }
  // TODO: nickname logic;
  const nick_uid = await query({nickname});
  if (nick_uid && nick_uid !== req.session.user && -nick_uid !== req.session.user)
    return {success: false, error: 'nickname'};

  const row = await db.find(
      'UPDATE users SET nickname = $1, gender = $2, qq = $3, phone = $4, real_name = $5, school = $6, password = $7, words = $8 WHERE user_id = $9'+
      'RETURNING nickname, email, gender, qq, phone, real_name, school, password, words',
      [nickname, gender, qq, phone, real_name, school, password, words, req.session.user]);

  return {success: row !== false, row:{...row, ...emailRow}};
};

const avatar = async (req, info) => {
  let {nickname, uid, filename} = info;
  if(filename)
    return await redis.set(`avatar:${req.session.user}`, filename);
  if(nickname) uid = await query({nickname});
  const avatarFile = await redis.get(`avatar:${uid}`);
  if (avatarFile && fs.existsSync(`${AVATAR_PATH}/${file}`)) {
    return `${AVATAR_PATH}/${file}`;
  } else {
    return `${AVATAR_PATH}/default.png`;
  }
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
    return {success: false, retry: false, error: 'have had too many'};

  let key , secret;

  key = crypto.randomBytes(6).toString('hex');
  secret = crypto.randomBytes(12).toString('hex');

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
  add,
  update,
  avatar,
  group: {
    add: addToGroup,
    remove: removeFromGroup,
    adjust: adjustGroup,
  },
  email: {
    sendVerification: sendVerificationEmail,
    verify: verifyEmail,
    update: updateEmail,
  },
  api: {
    list: listApi,
    generate: generateApi,
    enable: operateApi('enable'),
    disable: operateApi('disable'),
    remove: operateApi('remove'),
    rename: operateApi('rename'),
  }
};
