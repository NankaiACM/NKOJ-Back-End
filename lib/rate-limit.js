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
    res.set({'Retry-After': ttl});
    return res.fatal(429, {'Retry-After': ttl})
  }
  redis.expire(key, ttl);
  next()
};

const require_limit = type => async (req, res, next) => {
  const key = `limit:${req.ip}:${type}`;
  let ret;
  try{
    ret = await redis.multi().get(key).ttl(key).exec();
  } catch (e) {
    console.error(e);
    next(e);
  }
  if(!ret[0][1]) return next();
  const ttl = rule[type].ttl > 5 ? ret[1][1] : rule[type].ttl;
  if (ret[0][1] > rule[type].times) {
    res.set({'Retry-After': ttl});
    return res.fatal(429, {'Retry-After': ttl})
  }
  next()
};

const apply_limit = async (type, req) => {
  const key = `limit:${req.ip}:${type}`;
  redis.multi().incr(key).expire(key, rule[type].ttl).exec();
};

module.exports = {
  limit,
  apply_limit,
  require_limit
};
