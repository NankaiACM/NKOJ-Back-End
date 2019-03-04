const router = require('express').Router()
const db = require('../database/db')
const fc = require('../lib/form-check')
const striptags = require('striptags')
const {limit} = require('../lib/rate-limit')
const {require_perm, POST_NEW_POST, REPLY_POST} = require('../lib/permission')

// 获得帖子

router.get('/:post', async (req, res, next) => {
  const post = Number(req.params.post)
  if (!Number.isInteger(post)) return next()

  const result = await db.query(
    'SELECT * FROM posts WHERE removed_date IS NULL AND (post_id = $1 OR parent_id = $1) ORDER BY since'
    , [post]
  )

  res.ok(result.rows)
})

// 发新帖子

router.post('/:pid'
  , require_perm(POST_NEW_POST)
  , fc.all(['title', 'content'])
  , limit('post')
  , async (req, res, next) => {

    const pid = Number(req.params.pid)
    if (!Number.isInteger(pid)) return next()

    const uid = req.session.user
    const title = req.fcResult.title

    const content = striptags(req.fcResult.content, ['span', 'strong', 'color', 'img', 'b', 'a'])
    const nick_result = db.query(`SELECT nickname FROM users WHERE user_id = {uid}`)
    if ( !nick_result.rows.length) {
        res.fail(500, 'user id not found')
    }
    const nickname = nick_result.rows[0].nickname
    const ret = await db.query(
      'INSERT INTO post (user_id, nickname, title, content, problem_id, ipaddr_id)' +
      ' VALUES ($1, $2, $3, $4, $5, get_ipaddr_id($6)) RETURNING *', [uid, nickname, title, content, pid || undefined, req.ip]
    )

    res.ok(ret.rows[0])
  })


// 回复帖子

router.post('/reply/:parent'
  , require_perm(REPLY_POST)
  , fc.all(['content'])
  , limit('post')
  , async (req, res, next) => {

    const parent = Number(req.params.parent)
    if (!Number.isInteger(parent)) return next()

    const uid = req.session.user
    const content = striptags(req.fcResult.content, ['span', 'strong', 'color', 'img', 'b', 'a'])

    const p = await db.query('SELECT parent_id, problem_id, closed_date, removed_date FROM post WHERE post_id = $1', [parent])
    if (!p.rows.length)
      return res.fail(404, 'origin post not found')

    const row = p.rows[0]
    if (row.parent_id || row.closed_date || row.removed_date)
      return res.fail(422, 'origin post not accept reply')

    const pid = row.problem_id

    const nick_result = db.query(`SELECT nickname FROM users WHERE user_id = {uid}`)
    if ( !nick_result.rows.length) {
        res.fail(500, 'user id not found')
    }
    const nickname = nick_result.rows[0].nickname

    const ret = await db.query(
      'INSERT INTO post (user_id, nickname,content, parent_id, problem_id, ipaddr_id)' +
      ' VALUES ($1, $2, $3, $4, $5, get_ipaddr_id($6)) RETURNING *', [uid, nickname, content, parent, pid, req.ip]
    )

    res.ok(ret.rows[0])
  })

// 帖子赞同 / 反对

router.get('/:type(upvote|downvote|rmvote)/:post'
  , require_perm()
  , limit('vote')
  , async (req, res, next) => {

    const post = Number(req.params.post)
    if (!Number.isInteger(post)) return next()

    const uid = req.session.user

    const p = await db.query('SELECT problem_id, closed_date, removed_date FROM post WHERE post_id = $1', [post])
    if (!p.rows.length)
      return res.fail(404, 'origin post not found')

    const row = p.rows[0]
    if (row.closed_date || row.removed_date)
      return res.fail(422, 'origin post not support vote')

    let ret

    if (req.params.type === 'rmvote') {
      ret = await db.query('DELETE FROM post_vote WHERE user_id = $1 AND post_id = $2', [uid, post])
    } else {
      ret = await db.query(
        'INSERT INTO post_vote (user_id, post_id, attitude)' +
        ' VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *', [uid, post, req.params.type === 'upvote']
      )
    }
    res.ok({affected: ret.rowCount})
  })

// 评论帖子

router.post('/comment/:post', require_perm(REPLY_POST), limit('post')
  , fc.all(['content']), async (req, res, next) => {
    const post = Number(req.params.post)
    if (!Number.isInteger(post)) return next()

    const uid = req.session.user
    const p = await db.query('SELECT problem_id, closed_date, removed_date FROM post WHERE post_id = $1', [post])
    if (!p.rows.length)
      return res.fail(404, 'origin post not found')

    const row = p.rows[0]

    if (row.closed_date || row.removed_date)
      return res.fail(422, 'origin post not support comment')

    const content = striptags(req.fcResult.content, ['span', 'strong', 'color', 'img', 'b', 'a'])
        const nick_result = db.query(`SELECT nickname FROM users WHERE user_id = {uid}`)
        if ( !nick_result.rows.length) {
            res.fail(500, 'user id not found')
        }
        const nickname = nick_result.rows[0].nickname
    const ret = await db.query(
      'INSERT INTO post_reply (reply_to, user_id, nickname, content, ipaddr_id)' +
      ' VALUES ($1, $2, $3, $4, get_ipaddr_id($5)) RETURNING *', [post, uid, nickname, content, req.ip]
    )

    res.ok(ret.rows[0])
  })

// 赞同评论

router.get('/like/:comment', require_perm(), limit('vote'), async (req, res, next) => {

  const comment = Number(req.params.comment)
  if (!Number.isInteger(comment)) return next()

  const uid = req.session.user

  const p = await db.query('SELECT removed_date FROM post_reply WHERE reply_id = $1', [comment])
  if (!p.rows.length)
    return res.fail(404, 'origin comment not found')

  const row = p.rows[0]
  if (row.removed_date)
    return res.fail(422, 'origin comment not support vote')

  const ret = await db.query(
    'INSERT INTO reply_vote (user_id, reply_id)' +
    ' VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *', [uid, comment]
  )

  res.ok({affected: ret.rowCount})
})

module.exports = router
