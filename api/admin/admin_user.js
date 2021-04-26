const router = require('express').Router()
import {require_perm, MANAGE_ROLE, SUPER_ADMIN} from '../../lib/permission'
import db from '../../database/db'
import fc from '../../lib/form-check'
import session  from '../../lib/session'
import {encrypt, genRawStr} from '../../lib/rsa'

// TODO: test
router.post('/add', fc.all(['nickname', 'password', 'email', 'words', 'count']), async (req, res) => {
  'use strict'
  const form = req.fcResult

  if (form.count === 1) {
    const password = form.password || Math.random().toString(36).substring(2)
    try {
      const ret = await db.query(`INSERT INTO users (nickname, password, email, gender, role, school, words, ipaddr)
SELECT COALESCE($1, CONCAT('ojuser_', t.val)), $2, COALESCE($3, CONCAT('ojuser_',t.val,'@dummy.nankai.edu.cn')), $4, $5, $6, $7, '::ffff:127.0.0.1'
FROM (SELECT nextval('users_defaultname_seq') as val) AS t RETURNING nickname`
        , [form.nickname, password, form.email, 3, `{1, 4}`, 'NKU', form.words])
      res.ok({nickname: ret.rows[0].nickname, password: password})
    } catch (err) {
      res.fail(520, err)
      throw err
    }
  } else {
    const retArr = []
    for (let i = 0; i < form.count; i++) {
      const password = form.password || Math.random().toString(36).substring(2)
      try {
        const ret = await db.query(`INSERT INTO users (nickname, password, email, gender, role, school, words, ipaddr)
SELECT CONCAT(COALESCE($1, 'ojuser'), '_' , t.val), $2, CONCAT(COALESCE($1, 'ojuser'), '_', t.val,'@dummy.nankai.edu.cn'), $3, $4, $5, $6, '::ffff:127.0.0.1'
FROM (SELECT nextval('users_defaultname_seq') as val) AS t RETURNING nickname`
          , [form.nickname, password, 3, `{1, 4}`, 'NKU', form.words])
        retArr.push({nickname: ret.rows[0].nickname, password: password})
      } catch (err) {
        res.fail(520, err)
        throw err
      }
    }
    res.ok(retArr)
  }
})

router.get('/remove/:who', async (req, res) => {
  'use strict'
  const user = req.params.who
  if (user === req.session.user)
    return res.fail(1)

  let ret
  if (Number.isInteger(Number(user)))
    ret = await db.query(`UPDATE users SET removed = 't'::boolean WHERE user_id = $1 RETURNING user_id`, [user])
  else
    ret = await db.query(`UPDATE users SET removed = 't'::boolean WHERE nickname = $1 RETURNING user_id`, [user])

  if (ret.rows.length) {
    res.ok({removed: ret.rows[0].user_id})
    session.logout(ret.rows[0].user_id)
  }
  else
    res.fail(1, 'no such user')
})

router.get('/logout/:who', async (req, res) => {
  'use strict'
  const who = req.params.who
  if (who === 'all') {
    session.logoutAll()
  } else {
    session.logout(who)
  }
  res.ok()
})

// add multiple contset users
router.get('/addmulti/:cid/:num', fc.all(['cid']), async (req, res, next) => {
  const cid = parseInt(req.params.cid)
  const num = parseInt(req.params.num);
  let ret = await db.query(`SELECT contest_id, private FROM contests WHERE contest_id = ${cid}`)
  if (ret.rows.length === 0) return res.fail(404, 'contest not found') 
  if (!ret.rows[0].private) 
    return res.fail(422, 'A public contest is not applicable for contest users')
  ret = await db.query(
    'SELECT split_part(nickname, \'_\', 2) AS mid FROM users WHERE nickname LIKE $1 ORDER BY nickname DESC LIMIT 1',
    ['c' + cid + '_%']
  )
  const begin = ret.rows.length === 0 ? 1 : parseInt(ret.rows[0].mid) + 1 
  let insertArr = Array(num), resUser = new Array(num)
  for (let i = 0; i < num; i++) {
    const name = `c${cid}_${i+begin}`
    const pass_raw = genRawStr(8)
    const pass_en = encrypt(pass_raw)
    insertArr[i] = `(
      '${name}','${pass_en}','${name}@dummy.nankai.edu.cn',
      3, '{1, 4}', 'NKU', 'A', '::ffff:127.0.0.1')`
    resUser[i] = {username: name, password: pass_raw}
  }
  const insertPrefix = 'INSERT INTO users (nickname, password, email, gender, role, school, words, ipaddr) VALUES'
  const insertSuffix = ' RETURNING user_id'
  try {
    ret = await db.query(insertPrefix + insertArr.join(',') + insertSuffix)
    for (let i = 0; i < num; i++) {
      resUser[i].user_id = ret.rows[i].user_id      
    }
    return res.ok({resUser})
  } catch (e) {
    return res.fail(520, e)
  }
})

module.exports = router
