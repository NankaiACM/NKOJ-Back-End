const db = require('../../database/db')
const router = require('express').Router()
const fc = require('../../lib/form-check')
const {sendMessage} = require('../../lib/message')

// 列出未处理的举报

router.get('/', async (req, res) => {
  const ret = await db.query('SELECT * FROM reports WHERE handler IS NULL ORDER BY "when" DESC LIMIT 150')

  res.ok(ret.rows)
})

router.get('/:from(\\d+)/:limit(\\d+)?', async (req, res) => {
  'use strict'
  let from = Number(req.params.from)
  let limit = Number(req.params.limit || 0)
  if (limit > 150) limit = 150

  if (from < 0 || limit < 0) return next()

  const queryString = `SELECT * FROM reports WHERE handler IS NULL ORDER BY "when" DESC LIMIT $1 OFFSET $2`
  const result = await db.query(queryString, [limit, from])
  if (result.rows.length > 0)
    return res.ok(result.rows)
  return res.sendStatus(204)
})

// 列出全部举报

router.get('/all', async (req, res) => {
  const ret = await db.query('SELECT * FROM reports ORDER BY "when" DESC LIMIT 150')

  res.ok(ret.rows)
})

router.get('/all/:from(\\d+)/:limit(\\d+)?', async (req, res) => {
  'use strict'
  let from = Number(req.params.from)
  let limit = Number(req.params.limit || 0)
  if (limit > 150) limit = 150

  if (from < 0 || limit < 0) return next()

  const queryString = `SELECT * FROM reports ORDER BY "when" DESC LIMIT $1 OFFSET $2`
  const result = await db.query(queryString, [limit, from])
  if (result.rows.length > 0)
    return res.ok(result.rows)
  return res.sendStatus(204)
})

// 处理举报，// TODO: 降低用户权限，扣分
// 拒绝举报，// TODO: 识别恶意举报，扣分

// TODO: 暂时可以多次处理同一举报
// TODO: 根据 type 删除信息等...

router.get('/:type(approve|decline)/:rid/', fc.all(['rid']), async (req, res) => {
  const rid = req.fcResult.rid
  const ret = await db.query('UPDATE reports SET result = $1, handler = $2 WHERE report_id = $3 RETURNING *', [req.params.type === 'approve', req.session.user, rid])

  if (!ret.rowCount) return res.fail(404)

  const row = ret.rows[0]

  if (row.result) {
    sendMessage(row.reporter, '举报结果通知', `您在 ${row.when} 对用户 ${row.reportee} 举报成功，感谢~`)
  } else {
    sendMessage(row.reporter, '举报结果通知', `您在 ${row.when} 对用户 ${row.reportee} 的举报失败了QwQ，如有异议，请私信管理员`)
  }
  res.ok()

})

module.exports = router
