const router = require('express').Router()
const fc = require('../lib/form-check')
const db = require('../database/db')
const {limit} = require('../lib/rate-limit')

router.get('/', async (req, res) => {
  const uid = req.session.user

  // TODO: 聚合，限制长度

  const ret = await db.query('SELECT message_id, a as "from", b as "to", since FROM messages WHERE (a = $1 AND deleted_a = FALSE) OR (b = $1 AND deleted_b = FALSE) ORDER BY since', [uid])

  res.ok(ret.rows)
})

router.get('/announcement', async (req, res) => {
  const uid = req.session.user

  const ret = await db.query('SELECT message_id, title, content, since FROM messages WHERE a IS NULL AND b IS NULL ORDER BY since DESC')

  res.ok(ret.rows)
})

router.get('/system', async (req, res) => {
  const uid = req.session.user

  const ret = await db.query('SELECT message_id, title, content, since FROM messages WHERE a IS NULL AND b = $1  ORDER BY since DESC', [uid])

  res.ok(ret.rows)
})

router.get('/:uid', async (req, res, next) => {
  const uid = req.session.user
  const target = Number(req.params.uid)
  if (!Number.isInteger(target)) return next()

  if (target === uid) return res.ok([])

  const ret = await db.query('SELECT message_id, content, since FROM messages WHERE (a = $1 AND b = $2 AND deleted_a = FALSE) OR (b = $1 AND a = $2 AND deleted_b = FALSE) ORDER BY since', [uid, target])

  res.ok(ret.rows)
})

router.post('/:uid', fc.all(['uid', 'message']), limit('sendmsg'), async (req, res) => {
  const from = req.session.user
  const to = req.fcResult.uid
  const message = req.fcResult.message

  try {
    const r = await db.query('SELECT * FROM user_blocks WHERE blocker = $1 AND blockee = $2 LIMIT 1', [to, from])

    if (r.rowCount) return res.ok('but the target seems not like to receive your message')

    const ret = await db.query('INSERT INTO messages(a, b, content) VALUES ($1, $2, $3)', [from, to, message])
    return res.ok()
  } catch (e) {
    return res.fail(422)
  }
})

router.get('/delete/:mid', fc.all(['mid']), async (req, res) => {
  const mid = req.fcResult.mid
  const uid = req.session.user
  const ret = await db.query('SELECT * FROM messages WHERE message_id = $1 AND (a = $2 OR b = $2)', [mid, uid])
  if (!ret.rows.length) return res.fail(422)
  const row = ret.rows[0]
  if (!row.a)
    await db.query('DELETE FROM messages WHERE message_id = $1', [mid])
  else if (row.a === uid)
    await db.query('UPDATE messages SET deleted_a = TRUE WHERE message_id = $1', [mid])
  else
    await db.query('UPDATE messages SET deleted_b = TRUE WHERE message_id = $1', [mid])
  res.ok()
})

router.get('/deleteall/system', async (req, res) => {
  const uid = req.session.user
  await db.query('DELETE FROM messages WHERE a IS NULL AND b = $1', [uid])
  res.ok()
})

router.get('/deleteall/:uid', fc.all(['uid']), async (req, res) => {
  const uid = req.session.user
  const target = req.fcResult.uid
  if (uid === target) return res.fail(422)

  await db.query('UPDATE messages SET deleted_a = TRUE WHERE a = $1 AND b = $2', [uid, target])
  await db.query('UPDATE messages SET deleted_b = TRUE WHERE b = $1 AND a = $2', [uid, target])
  res.ok()
})

router.get('/report/:mid', fc.all(['mid']), async (req, res) => {
  const mid = req.fcResult.mid
  const uid = req.session.user
  const ret = await db.query('SELECT * FROM messages WHERE message_id = $1 AND a = $2 OR b = $2', [mid, uid])
  if (!ret.rows.length) return res.fail(422)
  const reportee = ret.rows[0].a

  try {
    const r = await db.query('INSERT INTO reports (reporter, reportee, type, which) VALUES ($1, $2, get_report_type_id($3), $4)', [uid, reportee, 'message', mid])
  } catch (e) {
    return res.fail(422, 'you have reported it...')
  }
  res.ok()
})

router.get('/block', async (req, res) => {
  const blocker = req.session.user

  const r = await db.query('SELECT blockee, since FROM user_blocks WHERE blocker = $1', [blocker])

  res.ok(r.rows)
})

router.get('/:type(block|unblock)/:uid', fc.all(['uid']), async (req, res) => {
  const blocker = req.session.user
  const blockee = req.fcResult.uid

  if (blocker === blockee) return res.fail(422)

  const ret = await db.query('SELECT count(*) as n FROM user_blocks WHERE blocker = $1', [blocker])
  if (ret.rows[0].n >= 30) return res.fail(1, 'you can block at most 30 users...')

  if (req.params.type === 'block') {
    try {
      const r = await db.query('INSERT INTO user_blocks (blocker, blockee) VALUES ($1, $2)', [blocker, blockee])
    } catch (e) {
      return res.fail(422, 'you have blocked this user before...')
    }
  } else {
    const r = await db.query('DELETE FROM user_blocks WHERE blocker = $1 AND blockee = $2', [blocker, blockee])
    return res.ok({affected: r.rowCount})
  }

  res.ok()
})


module.exports = router
