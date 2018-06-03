const router = require('express').Router()
const message = require('../lib/message')

router.get('/', async (req, res) => {
  const uid = req.session.user

  const ret = await db.query('SELECT title, a, b since FROM message WHERE (a = $1 AND deleted_a = FALSE) OR b = $1 AND delete_b = FALSE', [uid])

  res.ok(ret.rows)
})

router.get('/:uid', async(req, res) => {
  const uid = req.session.user

  const ret = await db.query('SELECT * FROM message WHERE (a = $1 AND deleted_a = FALSE) OR b = $1 AND delete_b = FALSE', [uid])

  res.ok(ret.rows)
})

router.post('/:uid', async(req, res) => {

})

router.get('/delete/:mid', async(req, res) => {

})

router.get('/report/:mid', async(req, res) => {

})

router.get('/block/:uid', async(req, res) => {

})

module.exports = router