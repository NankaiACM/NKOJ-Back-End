const {checkSchema, validationResult, oneOf} = require('express-validator/check')
const {matchedData} = require('express-validator/filter')
const validator = require('validator')
const decrypt = require('./rsa').decrypt

const all_rule = {
  in: ['params', 'query', 'body']
}

const default_rules = {
  none: {},
  integer: {
    errorMessage: 'is not an integer',
    isInt: true,
    toInt: true
  },
  nickname: {
    custom: {
      options: str => !validator.isNumeric(str) && !validator.isEmail(str),
      errorMessage: 'should not be pure number'
    },
    isLength: {
      options: {min: 3, max: 20},
      errorMessage: 'length is not between 3 and 20'
    }
  },
  email: {
    isEmail: true,
    errorMessage: 'is not an email'
  },
  password: {
    custom: {
      options: pwd => {
        pwd = pwd ? (pwd.length === 344 ? decrypt(pwd) : pwd) : ''
        return pwd && pwd.length >= 6 && pwd.length <= 20
      },
      errorMessage: 'length is not between 6 and 20, or failed to decrypt'
    },
    customSanitizer: {
      options: pwd => pwd ? (pwd.length === 344 ? decrypt(pwd) : pwd) : ''
    }
  },
  gender: {
    custom: {
      options: gen => Number.isInteger(Number(gen)) && Number(gen) >= 0 && Number(gen) <= 3,
      errorMessage: 'not an integer between 0 and 3'
    },
    customSanitizer: {
      options: gen => Number(gen) || 0
    },
    optional: true
  },
  school: {
    isLength: {
      options: {min: 2, max: 40},
      errorMessage: 'length is not between 2 and 40'
    },
    optional: true
  },
  optional: {
    optional: true
  },
  title: {
    isLength: {
      options: {min: 3, max: 80},
      errorMessage: 'length is not between 3 and 80'
    }
  },
  boolean: {
    custom: {
      options: bool => (typeof bool === 'boolean') ? true : (validator.isIn(bool ? bool.toString() : '', ['0', '1']))
    },
    toInt: true
  },
  qq: {
    isLength: {
      options: {min: 5, max: 13},
      errorMessage: 'length is not between 5 and 13'
    },
    isInt: true,
    optional: true
  },
  phone: {
    isMobilePhone: {
      options: 'zh-CN'
    },
    optional: true
  },
  real_name: {
    isLength: {
      options: {max: 20},
      errorMessage: 'length is not between 2 and 20'
    },
    optional: true
  },
  words: {
    isLength: {
      options: {max: 50},
      errorMessage: 'max length is 50'
    },
    trim: true,
    escape: true,
    optional: true
  },
  code: {
    isLength: {
      options: {min: 1, max: 50000},
      errorMessage: 'max length is 50k bytes...'
    },
    trim: true
  },
  api_name: {
    isLength: {
      options: {min: 1, max: 20},
      errorMessage: 'max length is 20'
    },
    trim: true
  },
  content: {
    isLength: {
      options: {min: 1, max: 5000},
      errorMessage: 'max length is 5000'
    },
    trim: true
  },
  comment_content: {
    isLength: {
      options: {min: 1, max: 600},
      errorMessage: 'max length is 600'
    },
    trim: true
  },
  message: {
    isLength: {
      options: {min: 3, max: 600},
      errorMessage: 'length: 3 - not very long'
    },
    escape: true
  }
}

const getRule = (key, which) => {
  which = which ? which.split('/') : [key]
  let obj = {...all_rule}
  which.forEach(k => obj = {...obj, ...default_rules[k]})
  return {[key]: obj}
}

const getCheckSchema = (key, which) => {
  return checkSchema(getRule(key, which))
}

const rules = {
  l: getCheckSchema('l', 'integer/optional'),
  r: getCheckSchema('r', 'integer/optional'),
  id: getCheckSchema('id', 'integer'),
  user: [oneOf([getCheckSchema('user', 'email'), getCheckSchema('user', 'nickname')])],
  count: getCheckSchema('count', 'integer'),
  problem_id: getCheckSchema('problem_id', 'integer'),
  cases: getCheckSchema('cases', 'integer'),
  time_limit: getCheckSchema('time_limit', 'integer'),
  memory_limit: getCheckSchema('memory_limit', 'integer'),
  special_judge: getCheckSchema('special_judge', 'integer'),
  detail_judge: getCheckSchema('detail_judge', 'boolean'),
  level: getCheckSchema('level', 'integer'),
  pid: getCheckSchema('pid', 'integer'),
  did: getCheckSchema('did', 'integer'),
  cid: getCheckSchema('cid', 'integer'),
  mid: getCheckSchema('mid', 'integer'),
  uid: getCheckSchema('uid', 'integer'),
  rid: getCheckSchema('rid', 'integer'),
  lang: getCheckSchema('lang', 'integer'),
  comment: getCheckSchema('content', 'comment_content')
}

const formatter = ({location, msg, param, value, nestedErrors}) => {
  let name = new Set()
  let reason = []
  if (nestedErrors) {
    nestedErrors.forEach(v => {
      name.add(v.param)
      reason.push(v.msg)
    })
  } else {
    name.add(param)
    reason.push(msg)
  }
  return {
    name: [...name].join(', '),
    message: reason.join(', or '),
    debug: {
      value: value === undefined ? null : value,
      location: location
    }
  }
}

module.exports = {
  all: (r) => async (req, res, next) => {
    let err = false
    if (!Array.isArray(r)) r = [r]
    for (let rule of r) {
      try {
        await new Promise(async (resolve, reject) => {
          const key = rule.split('/')[0]
          let handler = rules[rule] || getCheckSchema(key, default_rules[key] ? rule : 'none')
          const handlerCallback = () => {
            const errors = validationResult(req).formatWith(formatter)
            if (!errors.isEmpty()) {
              res.fail ? res.fail(422, errors.array()) : res.status(422).json(errors.array())
              reject()
            }
            req.fcResult = req.fcResult ? {...req.fcResult, ...matchedData(req)} : {...matchedData(req)}
            resolve()
          }
          if (!Array.isArray(handler)) handler = [handler]
          await new Promise(() => {handler.forEach((v) => { v(req, res, handlerCallback)})})
          resolve()
        })
      } catch (e) {
        if (e) console.error(e)
        return
      }
    }
    next()
  }
}
