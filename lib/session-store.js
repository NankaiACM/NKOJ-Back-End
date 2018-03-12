const RedisStore = require('connect-redis')(session)
const redis = require('redis')
const session_client = redis.createClient()
const {DB_SESSION_STORE} = require('../config/redis')
session_client.select(DB_SESSION_STORE)

const sessionStore = new RedisStore({
  client: session_client,
  db: DB_SESSION_STORE,
  logErrors: true
})

const logoutAll = () => {
  'use strict'
  sessionStore.ids(ids => {
    ids.forEach(t => {
      sessionStore.destroy(t)
    })
  })
}

const logout = (uid) => {
  'use strict'
  session_client.hkeys(`session:${uid}`).forEach(t => {
    sessionStore.destroy(t)
    session_client.del(t)
  })
}

const login = (uid, sid) => {
  'use strict'
  session_client.hset(`session:${uid}`, Date.now.toString(), sid)
}

sessionStore.login = login
sessionStore.logout = logout
sessionStore.logoutAll = logoutAll

module.exports = sessionStore

