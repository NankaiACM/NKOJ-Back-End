const router = require('express').Router()
const db = require('../database/db')

Date.prototype.format = function(fmt) {
  let o = {
    "M+" : this.getMonth()+1,                 //月份
    "d+" : this.getDate(),                    //日
    "h+" : this.getHours(),                   //小时
    "m+" : this.getMinutes(),                 //分
    "s+" : this.getSeconds(),                 //秒
    "q+" : Math.floor((this.getMonth()+3)/3), //季度
    "S"  : this.getMilliseconds()             //毫秒
  };
  if(/(y+)/.test(fmt)) {
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  }
  for (let k in o) {
    if(new RegExp("("+ k +")").test(fmt)){
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
  }
  return fmt;
}

router.get('/contest/register/:contest_id', async (req, res) => {
  'use strict'
  if(!req.session.user) return res.fatal(401)
  const contest_id = req.params.contest_id
  let queryString = 'SELECT * FROM contests WHERE contest_id = $1'
  let result = await db.query(queryString, [contest_id])
  if (result.rows.length > 0) {
    queryString = 'SELECT * FROM contests WHERE contest_id = $1 AND during @> $2'
    let nowtime = new Date().format("yyyy-MM-dd hh:mm:ss")
    nowtime = '[' + nowtime.toString() + ',' + nowtime.toString() + ']'
    console.log(nowtime)
    result = await db.query(queryString, [contest_id, nowtime])
    if(result.rows.length > 0){
      queryString = 'INSERT INTO contest_users (contest_id, user_id) VALUES ($1, $2)'
      result = await db.query(queryString, [contest_id, req.session.user])
      console.log(result)
      res.ok('Success!')
    } else {
      res.fail(2, 'Contest was over!')
    }
  } else
  return res.fail(1, 'No contest!')
})

module.exports = router
