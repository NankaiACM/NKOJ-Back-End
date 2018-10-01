const redis = require('$lib/redis')('mail');

const getEmailKey = email => `received:${email}`;

const send = (type) => {

};

const block = () => {

};

const unblock = () => {

};

const receive = async (email, subject) => {
  const key = getEmailKey(email);
  return await redis.set(key, subject, 'EX', 10 * 60);
};

const retrieve = async (email, subject) => {
  const key = getEmailKey(email);
  const ret = await redis.get(key);
  if(ret)
    await redis.del(key);
  return ret ? ret === subject : null;
};

module.exports = {
  receive,
  retrieve,
};
