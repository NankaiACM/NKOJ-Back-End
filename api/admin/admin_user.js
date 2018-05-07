const router = require('express').Router()
const path = require('path')
const {check_perm, MANAGE_ROLE, SUPER_ADMIN} = require('../../lib/perm-check')
const db = require(path.join(__dirname, '../database', 'db'))
//const check = require('../lib/form-check')
const { matchedData} = require('express-validator/filter');
const {validationResult}=require('express-validator/check')
const check=require('../../lib/form-check')
const sessionStore = require('../../lib/session-store')

router.post('/add',[check.nickname,check.password,check.email,check.words,check.count], async (req, res) => {
  'use strict'
 /* const keys = ['nickname', 'password', 'email', 'words', 'count']
  const values = [req.body.nickname, req.body.password, req.body.email, req.body.words, req.body.count]
  const rules = [undefined, undefined, undefined, undefined, {type: 'integer'}]
  const form = {}
  check(keys, values, rules, form)*/
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }
  const form = matchedData(req);
  console.log(form)
  if (!form.count || form.count === '1') form.count = 1

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
  if (user === '' || user === undefined || user === req.session.user)
    return res.fail(1)

  let ret
  if (Number.isInteger(Number(user)))
    ret = await db.query(`UPDATE users SET removed = 't'::boolean WHERE user_id = $1 RETURNING user_id`, [user])
  else
    ret = await db.query(`UPDATE users SET removed = 't'::boolean WHERE nickname = $1 RETURNING user_id`, [user])

  if (ret.rows.length) {
    res.ok({removed: ret.rows[0].user_id})
    sessionStore.logout(ret.rows[0].user_id)
  }
  else
    res.fail(1, 'no such user')
})

router.get('/logout/:who', async (req, res) => {
  'use strict'
  const who = req.params.who
  if (who === 'all') {
    sessionStore.logoutAll()
  } else {
    sessionStore.logout(who)
  }
  res.ok()
})

module.exports = router
