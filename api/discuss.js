const router = require('express').Router()
const { matchedData} = require('express-validator/filter');
const {validationResult}=require('express-validator/check')
const check=require('../lib/form-check')
router.get('/', (req, res) => {
  'use strict'
  res.ok(JSON.parse('[{' +
    '      "id": "//讨论item的id",' +
    '      "imgurl": "",' +
    '      "imgalt":"//头像替代文字，一般为发起者用户",' +
    '      "node": "//讨论所在版块",' +
    '      "title":"//讨论的标题",' +
    '      "timestamp": "//讨论发起的时间戳1518599888",' +
    '      "sponsor":"//讨论发起者",' +
    '      "terminator":"//最后回复的用户"' +
    '    },' +
    '    {' +
    '        "id": "1",' +
    '        "imgurl": "",' +
    '        "imgalt":"sakura",' +
    '        "node": "no",' +
    '        "title":"泰迪熊的体重是多少？",' +
    '        "timestamp": "1518599888",' +
    '        "sponsor":"sakura",' +
    '        "terminator":"泰迪熊"' +
    '    },' +
    '    {' +
    '        "id": "2",' +
    '        "imgurl": "",' +
    '        "imgalt":"sakura",' +
    '        "node": "no",' +
    '        "title":"泰迪熊的身高是多少？",' +
    '        "timestamp": "1518599888",' +
    '        "sponsor":"sakura",' +
    '        "terminator":"泰迪熊"' +
    '    }' +
    '  ]'
  ))
})
router.get('/list', [check.l,check.r],async (req, res) => {
  'use strict'

  const errors=validationResult(req)
  if(!errors.isEmpty())
  {
    res.fail(1,errors.array())
    return
  }

  const form=matchedData(req)

  let requested = form.r ? (form.r - (form.l || 0)) : 20
  let limit = requested > 50 ? 50 : requested
  let offset = form.l || 0
  let result = await db.query('SELECT * FROM discussions ORDER BY post_id DESC LIMIT $1 OFFSET $2', [limit, offset])
  if (result.rows.length) {
    return res.ok({
      requested: requested,
      served: result.rows.length,
      is_end: result.rows.length !== limit,
      list: result.rows
    })
  }
  return res.fatal(404)
})

module.exports = router
