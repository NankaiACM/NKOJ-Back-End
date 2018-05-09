const {generateFileString} = require('../../lib/problem')
const router = require('express').Router()
const db = require('../../database/db')
const {matchedData} = require('express-validator/filter')
const {validationResult} = require('express-validator/check')
const check = require('../../lib/form-check')
const {PROBLEM_PATH, TEMP_PATH} = require('../../config/basic')
const fs = require('fs')
const path = require('path')

const TYPE_PARTIAL_CONTENT = 0

router.post('/', [check.title, check.cases, check.time_limit, check.memory_limit, check.type, check.special_judge, check.detail_judge, check.tags, check.level], async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.fail(1, errors.array())
    return
  }
  req.form = matchedData(req)
  return next()
})

router.post('/', [check.description, check.input, check.output, check.sample_input, check.sample_output, check.hint], async (req, res, next) => {
  'use strict'
  // noinspection EqualityComparisonWithCoercionJS
  if (req.form.type != TYPE_PARTIAL_CONTENT) return next()
  const form1 = req.form
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.fail(1, errors.array())
    return
  }
  const checkres = matchedData(req)
  const form = Object.assign(form1, checkres)

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
