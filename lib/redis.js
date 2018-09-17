const redis = require('ioredis');
const config = require('$config/redis');

const keyMap = new Proxy({
  'mail': 0,
  'rate-limit': 0,
  'session': 1,
}, {
  get (obj, prop) {
    return prop in obj
        ? obj[prop] + config.db_offset
        : config.db_offset;
  }
});

module.exports = (database) => {
  const db = keyMap[database];
  return new redis({
    ...config,
    db
  });
};
