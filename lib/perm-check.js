const db = require('../database/db')
const check_perm = (permission) => {
  return async (req, res, next) => {
    if (!req.session.user) return res.fail(401)
    if (!permission) return next()
    if (!req.session.perm) {
      console.log(req.session.user)
      const result = await db.query('SELECT cal_perm($1) AS perm', [req.session.user])
      if (result.length) req.session.perm = result.rows[0].perm
    }
    req.session.perm && (req.session.perm[permission] === 1) ? next() : res.fail(403)
  }
}

const check_perm_bool = (req, permission) => {
  return new Promise((resolve, reject) => {
    if (!req.session.user) return resolve(false)
    if (!permission) return resolve(true)
    if (!req.session.perm) {
      console.log(req.session.user)
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
  })
}

module.exports = {
  check_perm: check_perm,
  check_perm_bool: check_perm_bool,
  LOGIN: 0,
  CHANGE_PROFILE: 1,
  CHANGE_AVATAR: 2,
  SUBMIT_CODE: 3,
  GET_CODE_SELF: 4,
  VIEW_OUTPUT_SELF: 5,
  COMMENT: 6,
  POST_NEW_POST: 7,
  REPLY_POST: 8,
  PUBLIC_EDIT: 9,
  ADD_PROBLEM: 10,
  EDIT_PROBLEM_SELF: 10,
  GET_CODE_OWNED: 10,
  BYPASS_STATISTIC_OWNED: 10,
  EDIT_PROBLEM_ALL: 11,
  ADD_CONTEST: 12,
  EDIT_CONTEST_SELF: 12,
  EDIT_CONTEST_ALL: 13,
  REJUDGE_CONTEST_SELF: 14,
  REJUDGE_CONTEST_ALL: 15,
  REJUDGE_ALL: 16,
  BYPASS_STATISTIC_ALL: 17,
  GET_CODE_ALL: 18,
  VIEW_OUTPUT_ALL: 19,
  MANAGE_ROLE: 20,
  SUPER_ADMIN: 21
}
