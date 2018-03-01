const error_string = {
  0: 'ok',
  400: 'bad request',
  401: 'not logged in',
  500: 'internal server error',
  501: 'not implemented',
  520: 'database query error'
}

const ends = (res, status, code, message, assign) => {
  const ret = {code: code}
  ret.message = message ? message : ( (assign && assign.message) ? assign.message : (error_string[code] ? error_string[code] : 'unknown error') )
  res.status(status).json(Object.assign(ret, assign))
}

const setResponsePrototype = (req, res, next) => {
  res.fatal = (code, error, message) => {
    'use strict'
    ends(res, code, code, message, {error: error})
    return res
  }

  res.fail = (code, error, message) => {
    'use strict'
    ends(res, 200, code, message, {error: error})
    return res
  }

  res.ok = (data, override = {}) => {
    const ret = {data: data}
    ends(res, 200, 0, undefined, Object.assign(ret, override))
    return res
  }

  next()
}

module.exports = {
  setResponsePrototype: setResponsePrototype
}
