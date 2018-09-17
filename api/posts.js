const router = require('express').Router()
const db = require('../database/index')
const fc = require('../lib/form-check')

const listDiscuss = async (req, res) => {
  'use strict'
  const form = req.fcResult
  const offset = form.l || 0
  const requested = form.r || 20
  const limit = requested > 50 ? 50 : requested

  const pid = form.pid

  // TODO: 帖子列表

  const result = await db.query(
    'SELECT post_id, user_id, title, since, last_active_date, last_active_user, positive, negative' +
    ' FROM post WHERE removed_date IS NULL AND parent_id IS NULL AND (CASE $1::int WHEN 0 THEN (problem_id IS NULL) ELSE (problem_id = $1) END)' +
    ' ORDER BY last_active_date DESC LIMIT $2 OFFSET $3'
    , [pid, limit, offset]
  )
  return res.ok({
    requested: requested,
    served: result.rows.length,
    is_end: result.rows.length < limit,
    list: result.rows
  })
}

router.get('/:pid/:l(\\d+)?/:r(\\d+)?', fc.all(['pid', 'l', 'r']), listDiscuss)
router.get('/list/:pid/:l(\\d+)?/:r(\\d+)?', fc.all(['pid', 'l', 'r']), listDiscuss)

module.exports = router
