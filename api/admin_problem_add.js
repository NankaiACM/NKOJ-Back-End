const {generateFileString} = require('../lib/problem_utils')
const router = require('express').Router()
const db = require('../database/db')
//const check = require('../lib/form-check')
const { matchedData} = require('express-validator/filter');
const {validationResult}=require('express-validator/check')
const check=require('../lib/form-check1')
const {PROBLEM_PATH, TEMP_PATH} = require('../config/basic')
const fs = require('fs')
const path = require('path')

const TYPE_PARTIAL_CONTENT = 0

router.post('/',[check.title,check.cases,check.time_limit,check.memory_limit,check.type,check.special_judge,check.detail_judge,check.tags,check.level], async (req, res, next) => {

  // basic information
  /*const body = req.body
  const keys = ['title', 'cases', 'time_limit', 'memory_limit', 'type', 'special_judge', 'detail_judge', 'tags', 'level']
  const values = [body.title, body.cases, body.time_limit, body.memory_limit, body.type, body.special_judge, body.detail_judge, body.tags, body.level]

  const rules = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, {empty: 'remove'}, {empty: 'remove'}]*/

  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }
  req.form = matchedData(req);
  //req.form = {}
  //const ret = check(keys, values, rules, req.form)
  //if (ret) return res.fail(1, ret)
  return next()
})

router.post('/', [check.description,check.input,check.output,check.sample_input,check.sample_output,check.hint],async (req, res, next) => {
  'use strict'
  // noinspection EqualityComparisonWithCoercionJS
  if (req.form.type != TYPE_PARTIAL_CONTENT) return next()
  /*const keys = ['description', 'input', 'output', 'sample_input', 'sample_output', 'hint']
  const values = [req.body.description, req.body.input, req.body.output, req.body.sample_input, req.body.sample_output, req.body.hint]
  const rules = undefined*/
  const form = req.form
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }
  const checkres=matchedData(req)
  const values = [checkres.description, checkres.input, checkres.output, checkres.sample_input, checkres.sample_output, checkres.hint]


  /*const ret = check(keys, values, rules, form)
  if (ret) return res.fail(1, ret)*/

  let tags = []
  let pid
  try {
    if (form.tags) {
      const t = typeof form.tags === 'string' ? JSON.parse(form.tags) : form.tags
      const r = await db.query('select insert_tags($1) as tags', [t])
      if (r.rows.length) {
        tags = r.rows[0].tags
      }
    }

    const r = await db.query('insert into problems (title, restriction_id, cases, special_judge, detail_judge, level, time_limit, memory_limit)' +
      ' values ($1, NULL, $2, $3::boolean, $4::boolean, $5::integer, $6::integer, $7::integer) returning problem_id', [form.title, form.cases, form.special_judge, form.detail_judge, form.level, form.time_limit, form.memory_limit])
    if (r.rows.length !== 1) return res.fail(520, 'database returns neither an error nor a successful insert')

    pid = r.rows[0].problem_id
    for (let tag in tags) {
      if (!tags.hasOwnProperty(tag)) continue
      await db.query('INSERT INTO problem_tag_assoc(problem_id, tag_id, official) VALUES ($1, $2, TRUE)', [pid, tags[tag]])
    }

  } catch (e) {
    console.log(e.stack || e)
    return res.fail(520, e.stack || e)
  }

  const filename = `${pid}.md`
  const content = generateFileString({
    description: form.description,
    input: form.input,
    output: form.output,
    sample_input: `<pre>${form.sample_input}</pre>`,
    sample_output: `<pre>${form.sample_output}</pre>`,
    hint: form.hint
  })

  fs.writeFileSync(path.resolve(PROBLEM_PATH, filename), content)

  res.ok({problem_id: pid, filename: filename, content: content})
})

module.exports = router
