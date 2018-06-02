const {DB_RATE_LIMIT} = require('../config/redis')
const redis = require('./redis')(DB_RATE_LIMIT)

const handler = {
  get (target, name) {
    return name in target ? {ttl: target[name][0], times: target[name][1]} : {ttl: 1, times: 10}
  }
}

const r = {
  sendmail: [60, 1],
  post: [60, 1]
}

const rule = new Proxy(r, handler)

const limit = type => async (req, res, next) => {
  'use strict'
  const key = `limit:${req.ip}:${type}`
  const ret = await redis.incrAsync(key)
  const ttl = rule[type].ttl
  if (ret > rule[type].times) {
    res.set({'Retry-After': ttl})
    return res.fatal(429, {'Retry-After': ttl})
  }
  redis.expire(key, ttl)
  next()
}

const require_limit = type => async (req, res, next) => {
  'use strict'
  const key = `limit:${req.ip}:${type}`
  const ret = await redis.getAsync(key)
  const ttl = rule[type].ttl
  if (ret > rule[type].times) {
    res.set({'Retry-After': ttl})
    return res.fatal(429, {'Retry-After': ttl})
  }
  next()
}

const apply_limit = async (type, req) => {
  'use strict'
  const key = `limit:${req.ip}:${type}`
  redis.incr(key)
  redis.expire(key, rult[type].ttl)
}

module.exports = {
  limit,
  apply_limit,
  require_limit
}
