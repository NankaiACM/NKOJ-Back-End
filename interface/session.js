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

const logoutAll = (uid) => {
  client.hgetall(`session:${uid}`, function (err, ret) {
    if (!ret) return;
    Object.keys(ret).forEach((k) => {
      store.destroy(ret[k]);
      client.hdel(`session:${uid}`, k);
    })
  })
};
const logout = (uid, sid) => {
  // TODO: test
  client.hgetall(`session:${uid}`, function (err, ret) {
    if (!ret) return;
    Object.keys(ret).forEach((k) => {
      if(ret[k] !== sid) return;
      store.destroy(ret[k]);
      client.hdel(`session:${uid}`, k);
    })
  })
};
const login = (info, req) => {
  req.session.user = info.user_id;
  req.session.permission = info.perm;
  req.session.nickname = info.nickname;
  req.session.save();
  client.hset(`session:${info.user_id}`, Date.now().toString(), req.session.id);
};

module.exports = {
  truncate,
  logoutAll,
  logout,
  login
};
