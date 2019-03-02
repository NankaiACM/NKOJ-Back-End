const router = require('express').Router()
const db = require('../../database/db')
const {PROBLEM_PATH} = require('../../config/basic')
const fs = require('fs')
const path = require('path')
const fc = require('../../lib/form-check')
const {generateFileString} = require('../../lib/problem')

const TYPE_PARTIAL_CONTENT = 0

router.post('/:pid',
  fc.all(['pid', 'title', 'cases', 'time_limit', 'memory_limit', 'type', 'special_judge', 'detail_judge', 'tags', 'level']),
  (req, res, next) => {
    req.form = req.fcResult
  return next()
})

router.post('/:pid',
  fc.all(['description', 'input', 'output', 'sample_input', 'sample_output', 'hint']),
  async (req, res, next) => {
    const form = Object.assign(req.form, req.fcResult)
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
