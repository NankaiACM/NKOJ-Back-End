const router = require('express').Router()
const {require_perm, MANAGE_ROLE, SUPER_ADMIN} = require('../../lib/permission')
const db = require('../../database/db')
const pool = require('../../database/init')
const fc = require('../../lib/form-check')
const session = require('../../lib/session')
const {genRawStr, getPass} = require('../../lib/rsa')

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
  // find max id with like c1001_1
  const begin = ret.rows.length === 0 ? 1 : parseInt(ret.rows[0].mid) + 1 
  let insertArr = Array(num), resUser = new Array(num)
  // prepare users
  for (let i = 0; i < num; i++) {
    const name = `c${cid}_${i+begin}`
    const pass_raw = genRawStr(8)
    const pass_en = pass_raw // getPass(pass_raw)
    //console.error(pass_en)
    insertArr[i] = `(
      '${name}','${pass_en}','${name}@dummy.nankai.edu.cn',
      3, 'NKU', 'A', '::ffff:127.0.0.1')`
    resUser[i] = {username: name, password: pass_raw}
  }
  const insertPrefix = 'INSERT INTO users (nickname, password, email, gender, school, words, ipaddr) VALUES'
  const addUserSQL = insertPrefix + insertArr.join(',') + ' RETURNING user_id'
  //console.error(addUserSQL)
  // use transaction
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    ret = await db.query(addUserSQL)
    if (ret.rows.length !== num) {
      throw RangeError('some user did not insert successfully')
    }
    //console.error(ret.rows)
    let idList = new Array(num)
    for (let i = 0; i < num; i++) {
      resUser[i].user_id = ret.rows[i].user_id
      idList[i] = `(${cid}, ${ret.rows[i].user_id})`
    }
    // console.error(idList)
    ret = await db.query(
      'INSERT INTO contest_users (contest_id, user_id) VALUES ' +
      idList.join(',') + ' ON CONFLICT DO NOTHING'
    )
    // console.error(ret.rows)
    return res.ok({resUser})
  } catch (e) {
    ret = await db.query('ROLLBACK')
    return res.fail(520, e)
  } finally {
    client.release()
  }
})

module.exports = router
