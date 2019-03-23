const {generateFileString} = require('../../lib/problem')
const router = require('express').Router()
const db = require('../../database/db')
const fc = require('../../lib/form-check')
const {PROBLEM_PATH} = require('../../config/basic')
const fs = require('fs')
const path = require('path')

const TYPE_PARTIAL_CONTENT = 0

router.post('/',
  fc.all(['title', 'cases', 'time_limit', 'memory_limit', 'type', 'special_judge', 'detail_judge', 'tags', 'level']),
  async (req, res, next) => {
    req.form = req.fcResult
    return next()
  })

router.post('/',
  fc.all(['description', 'input', 'output', 'sample_input', 'sample_output', 'hint']),
  async (req, res, next) => {
    'use strict'
    // noinspection EqualityComparisonWithCoercionJS
    if (req.form.type != TYPE_PARTIAL_CONTENT) return next()
    const form = Object.assign(req.form, req.fcResult)

    let tags = []
    let pid
    try {
      if (form.tags && form.tags.length) {
        const t = typeof form.tags === 'string' ? JSON.parse(form.tags) : form.tags
        const r = await db.query('select insert_tags($1) as tags', [t])
        if (r.rows.length) {
          tags = r.rows[0].tags
        }
      }

      const r = await db.query('insert into problems (title, contest_id, cases, special_judge, detail_judge, level, time_limit, memory_limit)' +
        ' values ($1, NULL, $2, $3, $4::boolean, $5::integer, $6::integer, $7::integer) returning problem_id', [form.title, form.cases, form.special_judge, form.detail_judge, form.level, form.time_limit, form.memory_limit])
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
      sample_input: `${form.sample_input}`,
      sample_output: `${form.sample_output}`,
      hint: form.hint
    })
    fs.writeFileSync(path.resolve(PROBLEM_PATH, filename), content)

    const json_content = {
      problem_id: pid,
      time_limit: form.time_limit,
      memory_limit: form.memory_limit,
      special_judge: form.special_judge,
      detail_judge: form.detail_judge
    }
    fs.writeFileSync(path.resolve(PROBLEM_PATH, `${pid}.json`), json_content)

    res.ok({problem_id: pid, filename: filename, content: content})
  })

module.exports = router
