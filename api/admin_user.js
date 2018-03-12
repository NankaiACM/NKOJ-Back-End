const router = require('express').Router()
const path = require('path')
const {check_perm, MANAGE_ROLE, SUPER_ADMIN} = require('../lib/perm-check')
const db = require(path.join(__dirname, '../database', 'db'))
const check = require('../lib/form-check')
const sessionStore = require('../lib/session-store')

router.get('/role', async (req, res) => {
  const ret = await db.query('SELECT * FROM user_role')
  res.ok(ret.rows)
})

router.get('/role/:rid', async (req, res) => {
  const role_id = req.params.rid
  try {
    const ret = await db.query('SELECT * FROM user_info WHERE user_role @> { $1 }', [role_id])
    if (ret.rows.length) res.ok(ret.rows)
    else res.fail(1, {rid: 'no such role'})
  }
  catch (err) {
    res.fail(520, err)
  }
})

router.get('/role/:uid/:type/:rid', check_perm(MANAGE_ROLE), async (req, res) => {
  const user_id = req.params.uid
  const role_id = req.params.rid
  const type = req.params.type

  let ret = await db.query(`SELECT user_role FROM user_info WHERE user_id = $1 LIMIT 1`, [user_id])

  if (ret.rows.length === 0) return res.fail(1, {uid: 'not exist'})
  let roles = ret.rows[0].user_role
  roles = roles.filter(i => i !== role_id)

  if (type === 'add') roles.push(role_id)

  try {
    ret = await db.query(`UPDATE user_info SET user_role = { $1 } WHERE user_id = $2 RETURNING *`, [roles.join(', '), user_id])
  } catch (err) {
    return res.fail(520, err)
  }

  res.ok(ret.rows[0])
})

// TODO: return permission and add role
// router.post('/add_role', check_perm(MANAGE_ROLE), async (req, res) => {
//   const keys = ['role_title', 'role_description', 'perm', 'negative']
//   const values = [req.body.title, req.body.description, req.body.perm, req.body.negative]
//   if (req.body.perm[20] === '1') {
//     res.fail(1, 'can\'t create super admin')
//   }
//   else {
//     const form = {}
//     let result = check(keys, values, {}, form)
//     if (result) return res.fail(400, result)
//     try {
//       const query = 'INSERT INTO user_role (title, description,perm, negative) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING role_id'
//       result = await db.query(query, [...values])
//     }
//     catch (err) {
//       res.fail(520, err)
//       throw err
//     }
//     if (result.rows.length === 0)
//       res.fail(1, {title: 'conflict'})
//     else res.ok(result.rows)
//   }
// })

router.get('/logout/:who', check_perm(SUPER_ADMIN), async (req, res) => {
  'use strict'
  const who = req.params.who

  if (who === 'all') {
    sessionStore.logoutAll()
  } else {
    sessionStore.logout(who)
  }
})

module.exports = router
