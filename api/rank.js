const db = require('../database/db')
const router = require('express').Router()

router.get('/', async (req, res) => {
  const time = []
  const myDate = new Date();
  const myres=[];
  for (let i = 0; i <= 5; i++) {
    time[i]=(myDate.getFullYear()-i).toString() +'-09-01';
  }
  for (let i = 0; i < 5; i++)
  {
    const query='SELECT user_nick.nickname,user_info.submit_ac,user_info.submit_all FROM user_info,user_nick where user_nick.nick_id=user_info.nick_id and join_time <  timestamp $1 and join_time >=timestamp $2 order by  submit_ac,submit_all  DESC limit 100'
    const result = await db.query(query, [time[i], time[i + 1]]);
    myres[i] = {}
    myres[i].data=result.rows;
    myres[i].key=i;
    myres[i].text=time[i];
  }
  res.ok(myres);
})

module.exports = router
