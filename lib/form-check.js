const decrypt = require('./rsa-decrypt')
const regex_email = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/
const xss=require('xss')
const default_rules = {
  integer: ['not an integer', {func: (val) => {return Number.isInteger(Number(val))}}],
  gender: ['not a number between 0-3', {type: 'integer', min: 0, max: 3}],
  email: ['not a valid email address', {func: (val) => {return regex_email.test(val)}}],
  nickname:
    [
      'length: 3-20, could not be pure number or something like an email address',
      {minLength: 3, maxLength: 20, func: (val) => { return /^[^0-9]\S+$/.test(val) && !regex_email.test(val)}}
    ],
  password: ['length: 6-16', {minLength: 6, maxLength: 16}],
  school: ['length < 80', {func: (val) => {return val.length < 80}}],
  qq: ['length 6-13', {minLength: 6, maxLength: 13}],
  words: ['length < 80', {maxLength: 80}],
  phone: ['length > 11', {func: (val) => {return /^\+?[0-9]{11,14}$/.test(val)}}],
  role_title: ['length < 16', {maxLength: 16}],
  role_description: ['length < 255', {maxLength: 255}],
  problem_title:['length < 30 ',{maxLength:30}]
}

const check_internel = (val, rule) => {
  if (rule.type && !check_internel(val, default_rules[rule.type][1])) return false
  if (val < rule.min || val > rule.max) return false
  if (val.length < rule.minLength || val.length > rule.maxLength) return false
  return !rule.func || rule.func(val)
}

const check = (keys, values, rules, form) => {
  const ret = {}
  if (!rules) rules = {}
  const length = keys.length
  for (let i = 0; i < length; i++) {
    const key = keys[i]
    let value = values[i]
    const rule = rules[i] || {}

    value=xss(value)

    if (value === undefined) {
      if (rule.nonexist !== 'allow' && rule.empty !== 'remove')
        ret[key] = 'is undefined'
      continue
    }

    if (value === '') {
      switch (rule.empty) {
        case 'remove':
          values[i] = undefined
          continue
        case undefined:
        case 'error':
          ret[key] = 'is empty'
        // fall through
        case 'allow':
          continue
      }
    }

    if (value.length === 172 && rule.decrypt !== false) {
      const t = decrypt(value)
      if (t) value = t
    }

    if (rule.toLower)
      value = value.toLowerCase()

    const type = rule.type || key
    if (default_rules[type] !== undefined) {
      if (!check_internel(value, default_rules[type][1]))
        ret[key] = default_rules[type][0]
    }
    values[i] = value
    if (form) form[key] = value
  }
  return Object.keys(ret).length === 0 ? false : ret
}

module.exports = check
