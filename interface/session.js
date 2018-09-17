const {client, store} = require('$lib/session');
const truncate = () => {
  store.ids((err, ids) => {
    ids.forEach(t => {
      store.destroy(t)
    })
  });

  client.keys('session:*', function (err, ret) {
    if (!ret) return;
    ret.forEach((k) => {
      session_client.del(k)
    })
  })
};

const logout = (uid) => {
  client.hgetall(`session:${uid}`, function (err, ret) {
    if (!ret) return;
    Object.keys(ret).forEach((k) => {
      store.destroy(ret[k]);
      client.hdel(`session:${uid}`, k);
    })
  })
};

const login = (uid, sid) => {
  client.hset(`session:${uid}`, Date.now().toString(), sid);
};

module.exports = {
  truncate,
  logout,
  login
};
