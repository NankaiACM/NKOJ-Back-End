const router = require('express').Router()
const db = require('../database/db')
const check = require('../lib/form-check')
const {PROBLEM_PATH} = require('../config/basic')
const fs = require('fs')
const path = require('path')

router.post('/add', async (req, res) => {
  'use strict'
  const keys = ['title', 'cases', 'time_limit', 'memory_limit', 'description', 'input', 'output', 'sample_input', 'sample_output', 'hint']
  const values = [req.body.title, req.body.cases, req.body.time_limit, req.body.memory_limit, req.body.description, req.body.input,
    req.body.output, req.body.sample_input, req.body.sample_output, req.body.hint]
  const rules = undefined
  const form = {}

  const ret = check(keys, values, rules, form)
  if (ret) return res.fail(ret)

  const r = await db.query('insert into problems (title, restriction_id, cases) values ($1, NULL, $2) returning problem_id', [form.title, form.cases])

  if (r.rows.length !== 1) res.fail('insert failed.')

  const pid = r.rows[0].problem_id
  const filename = `${pid}.md`
  const content = `## $$description$$

${form.description}

## $$input$$

${form.input}

## $$output$$

${form.output}

## $$sample_input$$

${form.sample_input}

## $$sample_output$$

${form.sample_output}

## $$hint$$

${form.hint} 
  `

  fs.writeFileSync(path.resolve(PROBLEM_PATH, filename), content)

  res.ok({problem_id: pid, filename: filename, content: content})
})

module.exports = router
