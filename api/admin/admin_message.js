const router = require('express').Router()
const {sendMessage} = require('../../lib/message')
const db = require('../../database/index')
const fc = require('../../lib/form-check')
// 广播私信

router.post('/:uid', async (req, res) => {
  const title = req.body.title
  const message = req.body.message

  if (!title) return res.gen422('title', 'is required')
  if (!message) return res.gen422('message', 'is required')

  if (title.length > 60)
    return res.gen422('title', 'length should <= 60')

  let uid = req.params.uid
  if (uid === 'all') {
    await sendMessage(undefined, title, message)
    return res.ok()
  }

  uid = Number(uid)

  if (!Number.isInteger(uid)) return res.fail(422)

  try {
    sendMessage(uid, title, message)
  } catch (e) {
    return res.fail(500, e.stack || e)
  }

  res.ok()
})

router.get('/withdraw/:mid', fc.all(['mid']), async (req, res) => {
  const ret = await db.query('DELETE FROM messages WHERE message_id = $1 AND a IS NULL', [req.fcResult.mid])

  res.ok({affected: ret.rowCount})
})

// TODO: 删除一定时间前的所有公告

module.exports = router
