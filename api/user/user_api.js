const router = require('express').Router()
const crypto = require('crypto')
const db = require('../../database/db')

router.get('/', async (req, res) => {
  const ret = await db.query('SELECT * FROM user_apikey WHERE user_id = $1', [req.session.user])
  const rows = ret.rows
  for (let i of rows) {
    delete i.hashed_key
  }
  res.ok(rows)
})

router.get('/apply', async (req, res) => {
  let key
  let secret
  const hash = crypto.createHash('sha256')

  const ret = await db.query('SELECT * FROM user_apikey WHERE user_id = $1', [req.session.user])
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
    return db.query('insert into user_apikey(user_id, app_key, hashed_key) values ($1, $2, $3)', [req.session.user, key, hashed_key])
  }).then(function () {
    res.ok({key, secret})
  }).catch(function (err) {
    // TODO: solve magic conflict -> retry promise
    if (typeof err === 'string') return
    return res.fail(500, err.stack || err)
  })

})

router.get('/:operate/:key', async (req, res) => {
  const op = req.params.operate
  const key = req.params.key
  if (key.length !== 32) return res.fail(422)

  let ret

  switch (op) {
    case 'enable':
      ret = await db.query('UPDATE user_apikey SET enabled = TRUE WHERE app_key = $1 AND user_id = $2 returning *', [key, req.session.user])
      break
    case 'disable':
      ret = await db.query('UPDATE user_apikey SET enabled = FALSE WHERE app_key = $1 AND user_id = $2 returning *', [key, req.session.user])
      break
    case 'remove':
      ret = await db.query('DELETE FROM user_apikey WHERE app_key = $1 AND user_id = $2 returning *', [key, req.session.user])
      break
    default:
      return res.fail(422)
  }
  if (!ret.rows.length) return res.fail(404)
  return res.ok()
})

module.exports = router
