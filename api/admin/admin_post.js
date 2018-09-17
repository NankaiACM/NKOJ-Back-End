const db = require('../../database/index')
const router = require('express').Router()
const fc = require('../../lib/form-check')

// 编辑帖子

router.post('/edit/:post', fc.all(['title', 'content']), async (req, res, next) => {
  const post = Number(req.params.post)
  if (!Number.isInteger(post)) return next()

  const title = req.fcResult.title
  const content = req.fcResult.content

  const reply = await db.query(
    'UPDATE post SET title = CASE WHEN parent_id IS NULL THEN $1 ELSE NULL END, content = $2, last_edit_date = current_timestamp, last_editor_id = $3 WHERE post_id = $4 RETURNING *'
    , [title, content, req.session.user, post])

  if (reply.rowCount) {
    res.ok(reply.rows[0])
  } else {
    res.fail(404)
  }

})

// 删除 / 还原帖子

router.get('/:type(remove|recover)/:post', async (req, res, next) => {
  const post = Number(req.params.post)
  if (!Number.isInteger(post)) return next()

  let reply
  if (req.params.type === 'remove')
    reply = await db.query('UPDATE post SET removed_date = current_timestamp WHERE post_id = $1', [post])
  else
    reply = await db.query('UPDATE post SET removed_date = NULL WHERE post_id = $1', [post])

  if (reply.rowCount) {
    res.ok({affected: reply.rowCount})
  } else {
    res.fail(404)
  }
})

// 删除评论

router.get('/:type(remove|recover)/comment/:comment', async (req, res, next) => {
  const comment = Number(req.params.comment)
  if (!Number.isInteger(comment)) return next()

  let reply
  if (req.params.type === 'remove')
    reply = await db.query('UPDATE post_reply SET removed_date = current_timestamp WHERE reply_id = $1', [comment])
  else
    reply = await db.query('UPDATE post_reply SET removed_date = NULL WHERE reply_id = $1', [comment])

  if (reply.rowCount) {
    res.ok({affected: reply.rowCount})
  } else {
    res.fail(404)
  }
})

module.exports = router
