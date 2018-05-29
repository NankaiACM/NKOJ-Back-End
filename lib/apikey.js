const crypto = require('crypto')
const db = require('../database/db')
const session = require('./session')

module.exports = (req, res, next) => {
  const key = req.body.apikey || req.query.apikey || undefined
  if (!key) return session(req, res, next)

  const secret = req.body.apisecret || req.query.apisecret || undefined
  if (!secret) return session(req, res, next)

  const hash = crypto.createHash('sha256')
  hash.update(`${key}${secret}`)
  const hashed_key = hash.digest('hex')

  db.query('SELECT * FROM user_apikey WHERE app_key = $1 and hashed_key = $2', [key, hashed_key]).then(function (ret) {
    if (!ret.rows.length) return res.fail(401, 'api key is not recognized')
    req.session = {}
    req.session.user = ret.rows[0].user_id
    next()
  }).catch(function (e) {
    next(e)
  })
}
