const {
  checkSchema, validationResult, oneOf,
} = require('express-validator/check');
const {matchedData} = require('express-validator/filter');
const validator = require('validator');
const {encrypt, decrypt} = require('$lib/rsa');

const ENCRYPTED_LENGTH = encrypt('test').length;

const all_rules = {
  in: ['params', 'query', 'body'],
};

const default_rules = {
  none: {},
  integer: {
    errorMessage: 'is not an integer',
    isInt: true,
    toInt: true,
  },
  nickname: {
    custom: {
      options: str => !validator.isNumeric(str) && !validator.isEmail(str),
      errorMessage: 'should not be pure number',
    },
    isLength: {
      options: {min: 3, max: 20},
      errorMessage: 'length is not between 3 and 20',
    },
  },
  email: {
    isEmail: true,
    errorMessage: 'is not an email',
  },
  password: {
    custom: {
      options: pwd => {
        pwd = pwd ? (pwd.length === ENCRYPTED_LENGTH ? decrypt(pwd) : pwd) : '';
        return pwd && pwd.length >= 6 && pwd.length <= 20;
      },
      errorMessage: 'length is not between 6 and 20, or failed to decrypt',
    },
    customSanitizer: {
      options: pwd => pwd ? (pwd.length === ENCRYPTED_LENGTH
          ? decrypt(pwd)
          : pwd) : '',
    },
  },
  gender: {
    custom: {
      options: gen => Number.isInteger(Number(gen)) && Number(gen) >= 0 &&
          Number(gen) <= 3,
      errorMessage: 'not an integer between 0 and 3',
    },
    customSanitizer: {
      options: gen => Number(gen) || 0,
    },
    optional: true,
  },
  school: {
    isLength: {
      options: {min: 2, max: 40},
      errorMessage: 'length is not between 2 and 40',
    },
    optional: true,
  },
  optional: {
    optional: true,
  },
  title: {
    isLength: {
      options: {min: 3, max: 80},
      errorMessage: 'length is not between 3 and 80',
    },
  },
  boolean: {
    custom: {
      options: bool => (typeof bool === 'boolean') ? true : (validator.isIn(
          bool ? bool.toString() : '', ['0', '1'])),
    },
    toInt: true,
  },
  qq: {
    isLength: {
      options: {min: 5, max: 13},
      errorMessage: 'length is not between 5 and 13',
    },
    isInt: true,
    optional: true,
  },
  phone: {
    isMobilePhone: {
      options: 'zh-CN',
    },
    optional: true,
  },
  real_name: {
    isLength: {
      options: {max: 20},
      errorMessage: 'length is not between 2 and 20',
    },
    optional: true,
  },
  words: {
    isLength: {
      options: {max: 50},
      errorMessage: 'max length is 50',
    },
    trim: true,
    escape: true,
    optional: true,
  },
  code: {
    isLength: {
      options: {min: 1, max: 50000},
      errorMessage: 'max length is 50k bytes...',
    },
    trim: true,
  },
  api_name: {
    isLength: {
      options: {min: 1, max: 20},
      errorMessage: 'max length is 20',
    },
    trim: true,
  },
  content: {
    isLength: {
      options: {min: 1, max: 5000},
      errorMessage: 'max length is 5000',
    },
    trim: true,
  },
  comment_content: {
    isLength: {
      options: {min: 1, max: 600},
      errorMessage: 'max length is 600',
    },
    trim: true,
  },
  message: {
    isLength: {
      options: {min: 3, max: 600},
      errorMessage: 'length: 3 - not very long',
    },
    escape: true,
  },
};

const getRule = (key, rules) => {
  rules = rules ? rules.split('/') : [key];
  let obj = {...all_rules};
  rules.forEach(k => obj = {...obj, ...default_rules[k]});
  return {[key]: obj};
};

const schema = (key, rules) => {
  return checkSchema(getRule(key, rules));
};

const special_rules = {
  l: 'integer/optional',
  r: 'integer/optional',
  id: 'integer',
  user: oneOf([schema('user', 'email'), schema('user', 'nickname')]),
  count: 'integer',
  problem_id: 'integer',
  cases: 'integer',
  time_limit: 'integer',
  memory_limit: 'integer',
  special_judge: 'boolean',
  detail_judge: 'boolean',
  level: 'integer',
  pid: 'integer',
  did: ' integer',
  cid: 'integer',
  mid: 'integer',
  uid: 'integer',
  rid: 'integer',
  lang: 'integer',
  comment: 'comment_content',
};

const formatter = ({location, msg, param, value, nestedErrors}) => {
  let name = new Set();
  let reason = [];
  if (nestedErrors) {
    nestedErrors.forEach(v => {
      name.add(v.param);
      reason.push(v.msg);
    });
  } else {
    name.add(param);
    reason.push(msg);
  }
  return {
    name: [...name].join(', '),
    message: reason.join(', or '),
    debug: {
      value: value === undefined ? null : value,
      location: location,
    },
  };
};

const check_internal = (rejectError, ...argv) => async (req, res, next) => {
      let err = false;
      if (!Array.isArray(argv)) argv = [argv];
      for (let rules of argv) {
        if (typeof rules === 'string')
          rules = {[rules.split('/')[0]]: rules};
        const promises = Object.keys(rule).
            map(key => new Promise((resolve, reject) => {
              const value = rules[key];
              let handlers = [
                typeof special_rules[key] === 'function'
                    ? special_rules[key]
                    : schema(key, special_rules[key]),
                schema(key, value)
              ];
              handlers.map(handler => new Promise((resolve, reject) => {
                handler(req, res, () => {
                  const errors = validationResult(req).formatWith(formatter);
                  if (!errors.isEmpty()) {
                    if(rejectError) {
                      typeof res.fail === 'function'
                          ? res.fail(422, errors.array())
                          : res.status(422).json(errors.array());
                    }
                    reject(errors.array());
                  }
                  req.fcResult = {...req.fcResult, ...matchedData(req)};
                  resolve();
                });
              }));
              Promise.all(handlers).then(resolve).catch(reject);
            }));
        await Promise.all(promises).catch((e)=>err=e);
        if(err) return err;
      }
      next();
    };

module.exports = {
  // accepts: string
  //    object {key: schema}
  //    array [string, {key: schema}]
  all(...argv) {
    return check_internal(true, ...argv);
  },
  check(req, ...argv){
    return check_internal(false, ...argv)(req);
  },
};
