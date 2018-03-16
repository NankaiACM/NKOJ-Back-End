const redis = require('redis')
const {promisify} = require('util')
module.exports = (database) => {
  const client = redis.createClient(6379, '192.168.233.128',{})
  client.select(database)
  return {
    set: client.set,
    get: client.get,
    setAsync: promisify(client.set).bind(client),
    getAsync: promisify(client.get).bind(client),
    del: client.del
  }
}
