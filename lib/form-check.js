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

const getRule = function getRule(key, rules) {
  rules = rules ? rules.split('/') : [key];
  let obj = {...all_rules};
  rules.forEach(k => obj = {...obj, ...default_rules[k]});
  return {[key]: obj};
};

const schema = function schema (key, rules) {
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

const handler_wrapper = (req, res, handler) => new Promise ((resolve, reject) => {
  handler(req, res, () => {
    const errors = validationResult(req).formatWith(formatter);
    if (!errors.isEmpty())
      return reject(errors.array());
    req.fcResult = {...req.fcResult, ...matchedData(req)};
    resolve();
  });
});

const check_internal = (rejectError, argv) => async (req, res, next) => {
  try {
    if(!Array.isArray(argv)) argv = [argv];
    for (let rules of argv) {
      if (typeof rules === 'string') {
        rules = {[rules.split('/')[0]]: rules};
      }
      const keys = Object.keys(rules);
      for (let key of keys) {
        const value = rules[key];
        let handlers = schema(key, value);
        if(special_rules[key]) {
          typeof special_rules[key] === 'function'
              ? handlers.push(special_rules[key])
              : handlers.concat(schema(key, special_rules[key]))
        }
        for (let handler of handlers) {
          await handler_wrapper(req, res, handler);
        }
      }
    }
    if(typeof next === 'function') next();
    return false;
  } catch (e) {
    if(rejectError && !res.headersSent)
      res.gen422(e);
    return e;
  }
};

module.exports = {
  // accepts: string
  //    object {key: schema}
  //    array [string, {key: schema}]
  all(...argv) {
    return check_internal(true, ...argv);
  },
  check(req, ...argv) {
    return check_internal(false, ...argv)(req);
  },
};
