const redis = require('redis')
const bluebird = require('bluebird')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)
module.exports = (database) => {
  const client = redis.createClient()
  client.select(database)
  return client
}
