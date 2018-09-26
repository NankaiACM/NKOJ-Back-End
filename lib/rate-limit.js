const redis = require('$lib/redis')('rate-limit');

const handler = {
  get (target, name) {
    return name in target
        ? {ttl: target[name][0], times: target[name][1]}
        : {ttl: 1, times: 10}
  }
};

const r = {
  sendmail: [60, 1],
  post: [60, 1],
  sendmsg: [120, 2]
};

const rule = new Proxy(r, handler);

const limit = type => async (req, res, next) => {
  const key = `limit:${req.ip}:${type}`;
  const ret = await redis.incr(key);
  const ttl = rule[type].ttl;
  if (ret > rule[type].times) {
    return res.fail429(ttl);
  }
  redis.expire(key, ttl);
  next()
};

const check_limit = type => async (req) => {
  const key = `limit:${req.ip}:${type}`;
  let ret = await redis.multi().get(key).ttl(key).exec();
  if(!ret[0][1]) return false;
  const ttl = rule[type].ttl;
  if (ret[0][1] > rule[type].times) {
    return ttl;
  }
  return false;
};

const require_limit = type => async (req, res, next) => {
  let ttl = await check_limit(type)(req);
  if(ttl === false)
    return next();
  return res.fail429(ttl);
};

const apply_limit = async (type, req) => {
  const key = `limit:${req.ip}:${type}`;
  await redis.multi().incr(key).expire(key, rule[type].ttl).exec();
};

module.exports = {
  limit,
  apply_limit,
  require_limit,
  check_limit
};
