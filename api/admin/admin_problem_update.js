const router = require('express').Router()
const db = require('../../database/db')
const {matchedData} = require('express-validator/filter')
const {validationResult} = require('express-validator/check')
const check = require('../../lib/form-check')
const {PROBLEM_PATH, TEMP_PATH} = require('../../config/basic')
const fs = require('fs')
const path = require('path')
const {generateFileString} = require('../../lib/problem_utils')

const TYPE_PARTIAL_CONTENT = 0

router.post('/:pid', [check.pid, check.title, check.cases, check.time_limit, check.memory_limit,
  check.type, check.special_judge, check.detail_judge, check.tags, check.level], (req, res, next) => {
  // basic information
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.fail(1, errors.array())
    return
  }
  req.form = matchedData(req)
  return next()
})

router.post('/:pid', [check.description, check.input, check.output, check.sample_input, check.sample_output, check.hint], async (req, res, next) => {

  const form = req.form
  // noinspection EqualityComparisonWithCoercionJS
  if (req.form.type == TYPE_PARTIAL_CONTENT) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.fail(1, errors.array())
      return
    }
    const checkres = matchedData(req)
  }
  let tags = []
  let pid = Number(form.pid)
  try {
    if (req.form.tags) {
      const t = typeof form.tags === 'string' ? JSON.parse(form.tags) : form.tags
      const r = await db.query('select insert_tags($1) as tags', [t])
      if (r.rows.length) {
        tags = r.rows[0].tags
      }
      await db.query('DELETE FROM problem_tag_assoc WHERE problem_id = $1', [pid])
    }

    const r = await db.query('update problems set title = COALESCE($1, title), cases = COALESCE($2, cases),' +
      ' special_judge = COALESCE($3::boolean, special_judge), detail_judge = COALESCE($4::boolean, detail_judge),' +
      ' level = COALESCE($5::integer, level), time_limit = COALESCE($6::integer, time_limit), memory_limit = COALESCE($7::integer, memory_limit)' +
      ' where problem_id = $8 returning problem_id'
      , [form.title, form.cases, form.special_judge, form.detail_judge, form.level, form.time_limit, form.memory_limit, pid])
    if (r.rows.length !== 1) return res.fail(520, 'database returns neither an error nor a successful insert')

    for (let tag in tags) {
      if (!tags.hasOwnProperty(tag)) continue
      await db.query('INSERT INTO problem_tag_assoc(problem_id, tag_id, official) VALUES ($1, $2, TRUE)', [pid, tags[tag]])
    }

  } catch (e) {
    return res.fail(520, e.stack || e)
  }

  // noinspection EqualityComparisonWithCoercionJS
  if (req.form.type != TYPE_PARTIAL_CONTENT)
    return res.ok({problem_id: pid})

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
