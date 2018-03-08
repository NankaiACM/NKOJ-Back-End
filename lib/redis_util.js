const redis = require('redis')
const {promisify} = require('util')
module.exports = (database) => {
  const client = redis.createClient()
  client.select(database)
  return {
    set: client.set,
    get: client.get,
    setAsync: promisify(client.set).bind(client),
    getAsync: promisify(client.get).bind(client),
    del: client.del
  }
}
