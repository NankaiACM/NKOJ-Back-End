const router = require('express').Router()
const path = require('path')
const {check_perm,MANAGE_ROLE,SUPER_ADMIN}=require('../lib/perm-check')
const db = require(path.join(__dirname, '../database', 'db'))
const check=require('../lib/form-check')

const group={

}
router.post('/', (req, res) => {
  'use strict'
})

function contains(a, obj) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === obj) {
      return i;
    }
  }
  return false;
}

router.get('/exchange_user_role/add/:i/:j',check_perm(MANAGE_ROLE),async(req,res)=>{
  //i user_id
  //j role_id
  const r_id=Number(req.params.j)
  try {
    const results=await db.query(`select user_role from user_info where user_id = $1`,[req.params.i])
    const qq=[...results.rows[0].user_role]
    if(contains(qq,r_id)===false)
      qq.push(r_id)
    qq.sort()
    console.log(qq.toString())
    const results1=await db.query(`update user_info set user_role = $1 `,[ '{'+qq.toString()+'}'])
    res.ok(results1)
  }
  catch (err)
  {
    res.fail(1,'err')
  }
})

router.get('/exchange_user_role/delete/:i/:j',check_perm(MANAGE_ROLE),async(req,res)=>{
  //i user_id
  //j role_id
  const r_id=Number(req.params.j)
  try {
    const results=await db.query(`select user_role from user_info where user_id = $1`,[req.params.i])
    const qq=[...results.rows[0].user_role]
    let tmp=contains(qq,r_id)
    if(tmp!==false)
      qq.splice(tmp,1)
    qq.sort()
    console.log(qq.toString())
    const results1=await db.query(`update user_info set user_role = $1 `,[ '{'+qq.toString()+'}'])
    res.ok(results1)
  }
  catch (err)
  {
    res.fail(1,'err')
  }
})

router.post('/add_super_admin/:i',check_perm(SUPER_ADMIN),async(req,res)=>
{
  //i user_id

})

router.get('/list',async (req, res) => {
  const result=await db.query(`select * from user_role`);
  res.ok(result.rows)
})

router.get('/list_role/:i',async(req,res)=>
{
  value='{'+req.params.i+'}'
  try {
    const result = await  db.query(`select * from user_info where user_role @> $1`, [value])
    res.ok(result)
  }
  catch (err)
  {
    res.fail(1,err)
    throw (err)
  }
})

router.post('/create_role',check_perm(MANAGE_ROLE), async (req, res) => {
  const keys = ['role_title', 'role_description', 'perm', 'negative']
  const values = [req.body.title, req.body.description,  req.body.perm,req.body.negative]
  if(req.body.perm[20]==='1') {
    res.fail(1, 'can\'t create super admin')
  }
  else {
    const form = {}
    let result = check(keys, values, {}, form)
    if (result) return res.fail(400, result)
    try {
      const query = 'INSERT INTO user_role (title, description,perm, negative) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING role_id'
      result = await db.query(query, [...values])
    }
    catch (err) {
      res.fail(520, err)
      throw err
    }
    if (result.rows.length === 0)
      res.fail(1, {title: 'conflict'})
    else res.ok(result.rows)
  }
})


module.exports = router
