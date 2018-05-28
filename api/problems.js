const router = require('express').Router()
const db = require('../database/db')
const fc = require('../lib/form-check')

router.get('/list', fc.all(['l', 'r']), async (req, res) => {
  'use strict'
  let form = req.fcResult
  let offset = form.l - 1 || 0
  let requested = form.r ? (form.r - offset) : 20
  let limit = requested > 50 ? 50 : requested
  let result = await db.query('SELECT * FROM problems order by problem_id limit $1 offset $2', [limit, offset])
  return res.ok({
    requested: requested,
    served: result.rows.length,
    is_end: result.rows.length < limit,
    list: result.rows
  })
})

module.exports = router
