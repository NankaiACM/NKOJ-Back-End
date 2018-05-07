const db = require('../database/db')
const router = require('express').Router()

router.get('/', async (req, res) => {
  const time = []
  const myDate = new Date()
  const myres = []
  for (let i = 0; i <= 5; i++) {
    time[i] = (myDate.getFullYear() - i).toString() + '-09-01'
  }
  for (let i = 0; i < 5; i++) {
    const query = 'SELECT user_nick.nickname,user_info.submit_ac,user_info.submit_all ' +
      'FROM user_info,user_nick WHERE user_nick.nick_id = user_info.nick_id AND join_time <  timestamp $1 AND join_time >=timestamp $2 ' +
      'ORDER BY  submit_ac,submit_all  DESC LIMIT 100'
    const result = await db.query(query, [time[i], time[i + 1]])
    myres[i] = {}
    myres[i].data = result.rows
    myres[i].key = i
    myres[i].text = time[i]
  }
  res.ok(myres)
})

module.exports = router
