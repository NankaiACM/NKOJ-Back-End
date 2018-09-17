const db = require('$db');

const query = async function(uid) {
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

const login = (req, user) => {

};

const info = () => {

};

const logout = () => {

};

const logoutAll = () => {

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

const setEmailVerified = () => {

};

const setEmailUnverified = () => {

};

const setIdentityVerified = () => {

};

const addAPIKey = () => {

};

const renameAPIKey = () => {

};

const removeAPIKey = () => {

};

module.exports = {
  query,
};
