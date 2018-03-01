const decrypt = require('./rsa-decrypt')
const regex_email = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/

const check = (keys, values, rules, messages) => {
  const ret = {}
  if (messages === undefined) messages = {}
  const length = keys.length
  for (let i = 0; i < length; i++) {
    if (!rules[i]) continue
    let val = values[i]
    if (!rules[i].allowEmpty) {
      if (!val) {
        ret[keys[i]] = messages[i] || 'is undefined'
        continue
      }
    }
    if (!rules[i].allowSpace) {
      if (typeof val.trim === 'function') val.trim()
    }
    if (rules[i].decrypt) {
      if (val.length === 172) {
        val = decrypt(val)
        if (!val) {
          ret[keys[i]] = messages[i] || 'decode failed'
          continue
        }
      }
    }
    if (rules[i].toLower) {
      if (val.toLowerCase)
        val = val.toLowerCase()
    }
    if (rules[i].func) {
      if (!rules[i].func(val)) {
        ret[keys[i]] = messages[i] || 'failed magic'
        continue
      }
    }

    if (rules[i].type) {
      let failed = false
      switch (rules[i].type) {
        case 'integer':
          if (!Number.isInteger(Number(val))) failed = true
          break
        case 'email':
          if (!regex_email.test(val)) failed = true
          break
        default:
          break
      }
      if (failed) {
        ret[keys[i]] = messages[i] || `not ${rules[i].type}`
        continue
      }
    }

    if (rules[i].max) {
      if (val > rules[i].max) {
        ret[keys[i]] = messages[i] || 'too large'
        continue
      }
    }
    if (rules[i].min) {
      if (val < rules[i].min) {
        ret[keys[i]] = messages[i] || 'too small'
        continue
      }
    }
    if (rules[i].maxLength) {
      if (val.length > rules[i].maxLength) {
        ret[keys[i]] = messages[i] || 'too long'
        continue
      }
    }
    if (rules[i].minLength) {
      if (val.length < rules[i].minLength) {
        ret[keys[i]] = messages[i] || 'too short'
        continue
      }
    }
    if (rules[i].regex) {
      if (!rules[i].regex.test(val)) {
        ret[keys[i]] = messages[i] || 'failed test'
      }
    }
    values[i] = val
  }
  return Object.keys(ret).length === 0 ? false : ret
}

module.exports = check
