const router = require('express').Router()
const path = require('path')
const {check_perm,MANAGE_ROLE}=require('../lib/perm-check')
const db = require(path.join(__dirname, '../database', 'db'))
const check=require('../lib/form-check')
const group={

}
router.post('/', (req, res) => {
  'use strict'
})

router.get('/list',async (req, res) => {
  const result=await db.query(`select * from user_role`);
  res.ok(result.rows)
})

router.get('/list_role',async(req,res)=>
{
  const find_user_role=req.body.user_role
  try {
    const tmp = await db.query(`select role_id from user_role where title = ($1)`, [find_user_role])
  }
  catch (err)
  {
    res.fail('1',err)
    throw(err)
  }
  //console.log(tmp.rows[0].role_id.toString())
  value='{'+tmp.rows[0].role_id.toString()+'}'
  //console.log(value)
  try {
    const result = await  db.query(`select * from user_info where user_role @> $1`, [value])
    res.ok(result)
  }
  catch (err)
  {
    res.fail('1',err)
    throw (err)
  }
})

router.post('/create_role',check_perm(MANAGE_ROLE), async (req, res) => {
  const keys = ['role_title', 'role_description', 'perm', 'negative']
  const values = [req.body.title, req.body.description,  req.body.perm,req.body.negative]
  const form = {}
  let result = check(keys, values, {}, form)
  if (result) return res.fail(400, result)
  try
  {
    const query = 'INSERT INTO user_role (title, description,perm, negative) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING role_id'
    result = await db.query(query, [...values])
  }
  catch (err)
  {
    res.fail(520, err)
    throw err
  }
  if(result.rows.length === 0)
    res.fail(1,{title:'conflict'})
  else res.ok(result.rows)
})


module.exports = router
