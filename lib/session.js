const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const client = require('$lib/redis')('session');

const sessionStore = new RedisStore({
  client,
  // DEV: remove
  logErrors: true
});

const session_config = require('$config/session');
const sessionParser = session({
  ...session_config,
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  cookie: {maxAge: 36000000},
  store: sessionStore,
});
sessionParser.store = sessionStore;
sessionParser.client = client;

module.exports = sessionParser;
