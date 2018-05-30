const router = require('express').Router()
const crypto = require('crypto')
const db = require('../../database/db')
const fc = require('../../lib/form-check')

router.get('/', async (req, res) => {
  const ret = await db.query('SELECT api_name, api_key, enabled, since FROM user_api WHERE user_id = $1', [req.session.user])
  res.ok(ret.rows)
})

router.get('/apply/:api_name?', fc.all(['api_name/optional']), async (req, res) => {
  let key
  let secret
  let name = req.fcResult.api_name

  const hash = crypto.createHash('sha256')

  const ret = await db.query('SELECT * FROM user_api WHERE user_id = $1', [req.session.user])
  if (ret.rows.length >= 3)
    return res.fail(1, 'You have had too many api keys...')

  new Promise(function (resolve, reject) {
    crypto.randomBytes(16, function (err, buffer) {
      if (err) return reject(err)
      key = buffer.toString('hex')
      resolve(key)
    })
  }).then(function (key) {
    return new Promise(function (resolve, reject) {
      crypto.randomBytes(24, function (err, buffer) {
        if (err) reject(err)
        secret = buffer.toString('hex')
        resolve(secret)
      })
    })
  }).catch(function (err) {
    res.fail(500, err.stack || err)
    throw 'magic'
  }).then(function (secret) {
    hash.update(`${key}${secret}`)
    const hashed_key = hash.digest('hex')
    return db.query('insert into user_api(user_id, api_key, api_hashed, api_name) values ($1, $2, $3, $4)', [req.session.user, key, hashed_key, name])
  }).then(function () {
    res.ok({key, secret})
  }).catch(function (err) {
    // TODO: solve magic conflict -> retry promise
    if (typeof err === 'string') return
    return res.fail(500, err.stack || err)
  })

})

router.get('/:operate/:key', async (req, res, next) => {
  const op = req.params.operate
  const key = req.params.key
  if (key.length !== 32) return res.fail(422)

  let ret
  switch (op) {
    case 'enable':
      ret = await db.query('UPDATE user_api SET enabled = TRUE WHERE api_key = $1 AND user_id = $2 returning enabled', [key, req.session.user])
      break
    case 'disable':
      ret = await db.query('UPDATE user_api SET enabled = FALSE WHERE api_key = $1 AND user_id = $2 returning enabled', [key, req.session.user])
      break
    case 'delete':
    case 'remove':
      ret = await db.query('DELETE FROM user_api WHERE api_key = $1 AND user_id = $2 returning *', [key, req.session.user])
      break
    default:
      return next()
  }
  if (!ret.rows.length) return res.fail(404)
  return res.ok(ret.rows[0])
})

router.get('/rename/:key/:api_name', fc.all(['api_name']), async (req, res) => {
  const key = req.params.key
  if (key.length !== 32) return res.fail(422)

  const name = req.fcResult.api_name
  let ret = await db.query('UPDATE user_api SET api_name = $1 WHERE api_key = $2 AND user_id = $3 returning api_name, api_key, enabled, since', [name, key, req.session.user])
  if (!ret.rows.length) return res.fail(404)
  return res.ok(ret.rows[0])
})

module.exports = router
