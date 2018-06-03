const db = require('../database/db')
const sendMessage = async function (req, to, title, content) {
  let ret
  if(req.fcResult) {
    const form = req.fcResult
    const from = req.session.user
    const to = form.to
    const title = form.title
    const content = form.content
    ret = await db.query('INSERT INTO messages (a, b, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [from, to, title, content])
  } else if (req === undefined) {
    ret = await db.query('INSERT INTO messages (a, b, title, content) VALUES (NULL, $1, $2, $3) RETURNING *',
      [to, title, content])
  } else {
    ret = await db.query('INSERT INTO messages (a, b, title, content) VALUES ($1, $1, $2, $3) RETURNING *',
      [req, to, title, content])
  }
  return ret
}