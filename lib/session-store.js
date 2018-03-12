const session = require('express-session')
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
  sessionStore.ids((err, ids) => {
    ids.forEach(t => {
      sessionStore.destroy(t)
    })
  })

  session_client.keys('session:*', function (err, ret) {
    if (!ret) return
    ret.forEach((k) => {
      console.log(k)
      session_client.del(k)
    })
  })
}

const logout = (uid) => {
  'use strict'
  session_client.hgetall(`session:${uid}`, function (err, ret) {
    if (!ret) return
    console.log(ret)
    Object.keys(ret).forEach((k) => {
      sessionStore.destroy(ret[k])
      session_client.hdel(`session:${uid}`, k)
    })
  })
}

const login = (uid, sid) => {
  'use strict'
  session_client.hset(`session:${uid}`, Date.now().toString(), sid)
}

sessionStore.login = login
sessionStore.logout = logout
sessionStore.logoutAll = logoutAll

module.exports = sessionStore

