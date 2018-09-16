const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const client = require('./redis')('session');

const sessionStore = new RedisStore({
  client,
  logErrors: true
});

const logoutAll = () => {
  sessionStore.ids((err, ids) => {
    ids.forEach(t => {
      sessionStore.destroy(t)
    })
  });

  session_client.keys('session:*', function (err, ret) {
    if (!ret) return;
    ret.forEach((k) => {
      console.log(k);
      session_client.del(k)
    })
  })
};

const logout = (uid) => {
  session_client.hgetall(`session:${uid}`, function (err, ret) {
    console.log(ret);
    if (!ret) return;
    Object.keys(ret).forEach((k) => {
      sessionStore.destroy(ret[k]);
      session_client.hdel(`session:${uid}`, k);
    })
  })
};

const login = (uid, sid) => {
  session_client.hset(`session:${uid}`, Date.now().toString(), sid);
};

const session_config = require('../config/session');
const sessionParser = session({
  ...session_config,
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  cookie: {maxAge: 36000000},
  store: sessionStore
});

sessionParser.login = login;
sessionParser.logout = logout;
sessionParser.logoutAll = logoutAll;

module.exports = sessionParser;

