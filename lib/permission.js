const db = require('../database/db')
const require_perm = (permission) => {
  return async (req, res, next) => {
    if (!req.session.user) return res.fatal(401)
    if (!permission) return next()
    if (!req.session.perm) {
      const result = await db.query('SELECT cal_perm($1) AS perm', [req.session.user])
      if (result.rows.length) req.session.perm = result.rows[0].perm
    }
    req.session.perm && (req.session.perm[permission] === '1') ? next() : res.fatal(403)
  }
}

const check_perm = (req, permission) => {
  return new Promise((resolve, reject) => {
    if (!req.session.user) return resolve(false)
    if (!permission) return resolve(true)
    if (!req.session.perm) {
      db.query('SELECT cal_perm($1) AS perm', [req.session.user]).then((res) => {
        if (res.length) {
          req.session.perm = res.rows[0].perm
          resolve(req.session.perm[permission] === 1)
        }
        else resolve(false)
      }).catch((err) => {
        reject(err)
      })
    }
    else return resolve(req.session.perm[permission] === 1)
  })
}

module.exports = {
  require_perm,
  check_perm,
  LOGIN: 'LOGIN',
  CHANGE_PROFILE: 'CHANGE_PROFILE',
  CHANGE_AVATAR: 'CHANGE_AVATAR',
  SUBMIT_CODE: 'SUBMIT_CODE',
  GET_CODE_SELF: 'GET_CODE_SELF',
  VIEW_OUTPUT_SELF: 'VIEW_OUTPUT_SELF',
  COMMENT: 'COMMENT',
  POST_NEW_POST: 'POST_NEW_POST',
  REPLY_POST: 'REPLY_POST',
  PUBLIC_EDIT: 'PUBLIC_EDIT',
  ADD_PROBLEM: 'ADD_PROBLEM',
  EDIT_PROBLEM_SELF: 'EDIT_PROBLEM_SELF',
  GET_CODE_OWNED: 'GET_CODE_OWNED',
  BYPASS_STATISTIC_OWNED: 'BYPASS_STATISTIC_OWNED',
  EDIT_PROBLEM_ALL: 'EDIT_PROBLEM_ALL',
  ADD_CONTEST: 'ADD_CONTEST',
  EDIT_CONTEST_SELF: 'EDIT_CONTEST_SELF',
  EDIT_CONTEST_ALL: 'EDIT_CONTEST_ALL',
  REJUDGE_CONTEST_SELF: 'REJUDGE_CONTEST_SELF',
  REJUDGE_CONTEST_ALL: 'REJUDGE_CONTEST_ALL',
  REJUDGE_ALL: 'REJUDGE_ALL',
  BYPASS_STATISTIC_ALL: 'BYPASS_STATISTIC_ALL',
  GET_CODE_ALL: 'GET_CODE_ALL',
  VIEW_OUTPUT_ALL: 'VIEW_OUTPUT_ALL',
  MANAGE_ROLE: 'MANAGE_ROLE',
  SUPER_ADMIN: 'SUPER_ADMIN'
}
