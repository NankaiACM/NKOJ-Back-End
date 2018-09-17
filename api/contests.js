const router = require('express').Router()
const db = require('../database/index')
const fc = require('../lib/form-check')

const listContest = async (req, res) => {
  let form = req.fcResult
  let offset = form.l || 0
  let requested = form.r || 20
  let limit = requested > 50 ? 50 : requested
  let result = await db.query('SELECT * FROM user_contests order by contest_id desc limit $1 offset $2', [limit, offset])
  return res.ok({
    requested: requested,
    served: result.rows.length,
    is_end: result.rows.length < limit,
    list: result.rows
  })
}

router.get('/:l(\\d+)?/:r(\\d+)?', fc.all(['l', 'r']), listContest)
router.get('/list/:l(\\d+)?/:r(\\d+)?', fc.all(['l', 'r']), listContest)

module.exports = router
