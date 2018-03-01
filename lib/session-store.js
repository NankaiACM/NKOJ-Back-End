const session = require('express-session')
const sessionStore = new session.MemoryStore()

// TODO: use redis as sessionStore instead!
module.exports = sessionStore
