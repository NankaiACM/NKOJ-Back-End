const {DB_CAPTCHA} = require('../config/redis')
const redis = require('../lib/redis-util')(DB_CAPTCHA)

const rule = {
  sendmail: [60, 1]
}

const ttl = type => rule[type] ? rule[type][0] : 1
const times = type => rule[type] ? rule[type][1] : 10

const limit = type => async (req, res, next) => {
  'use strict'
  const key = `limit:${req.ip}:${type}`
  const ret = await redis.incrAsync(key)
  console.log(ret, times(type))
  if (ret > times(type)) {
    res.set({'Retry-After': ttl(type)})
    return res.fatal(429, {'Retry-After': ttl(type)})
  }

  redis.expire(key, ttl(type))
  next()
}

module.exports = limit
