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
      options: gen => validator.isInt(gen) && Number(gen) > 0 && Number(gen) < 4,
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
      options: {min: 5, max: 80},
      errorMessage: 'length is not between 5 and 80'
    }
  },
  boolean: {
    custom: {
      options: bool => validator.isIn(bool ? bool.toString() : '', ['0', '1'])
    },
    toInt: true
  }
}

const getRule = (key, which) => {
  which = which ? which.split('/') : [key]
  const obj = {...all_rule}
  which.forEach(k => Object.assign(obj, default_rules[k]))
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
  time_limit: getCheckSchema('memory_limit', 'integer'),
  memory_limit: getCheckSchema('memory_limit', 'integer'),
  special_judge: getCheckSchema('special_judge', 'boolean'),
  detail_judge: getCheckSchema('detail_judge', 'boolean'),
  level: getCheckSchema('level', 'integer'),
  pid: getCheckSchema('pid', 'integer')
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
          let handler = rules[rule] || getCheckSchema(rule, default_rules[rule] ? undefined : 'none')
          const handlerCallback = () => {
            const errors = validationResult(req).formatWith(formatter)
            if (!errors.isEmpty()) {
              res.fail(422, errors.array())
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
