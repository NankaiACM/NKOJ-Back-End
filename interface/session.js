const {client, store} = require('$lib/session');

const truncate = () => {
  // TODO: test
  store.ids((err, ids) => {
    ids.forEach(t => {
      store.destroy(t);
    });
  });

  client.keys('session:*', function(err, ret) {
    if (!ret) return;
    ret.forEach((k) => {
      session_client.del(k);
    });
  });
};

const list = uid =>
    client.hgetall(`session:${uid}`);

const invalidatePermission = async uid => {
  const sessions = await list(uid);
  if (!sessions) return;
  Object.keys(sessions).forEach(k => {
    store.get(sessions[k], (_, session) => delete session.perm )
  });
};

const logoutAll = async uid => {
  const sessions = await list(uid);
  if (!sessions) return;
  Object.keys(sessions).forEach(k => {
    store.destroy(sessions[k]);
    client.hdel(`session:${uid}`, k);
  });
};

const logout = async (uid, sid) => {
  // TODO: test
  const sessions = await list(uid);
  if (!sessions) return;
  Object.keys(sessions).forEach(k => {
    if (sessions[k] !== sid) return;
    store.destroy(sessions[k]);
    client.hdel(`session:${uid}`, k);
  });
};

const login = (req, info) => {
  req.session.user = info.user_id;
  req.session.permission = info.perm;
  req.session.nickname = info.nickname;
  req.session.save();
  client.hset(`session:${info.user_id}`, Date.now().toString(), req.session.id);
};

module.exports = {
  truncate,
  logoutAll,
  list,
  logout,
  login,
  invalidatePermission,
};
