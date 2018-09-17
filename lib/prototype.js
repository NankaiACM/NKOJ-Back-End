const error_string = {
  0: 'ok',
  1: 'general error',
  233: 'captcha required',
  234: 'captcha not match',
  241: 'email auth required',
  242: 'name auth required',
  400: 'bad request',
  401: 'auth required',
  403: 'access denied',
  404: 'not found',
  422: 'unprocessable entity',
  429: 'too many requests',
  500: 'internal server error',
  501: 'not implemented',
  520: 'database query error',
  521: 'database internal error'
};

const ends = (res, status, code, message, assign) => {
  const ret = {code: code};
  ret.message = message || (assign ? assign.message : undefined) ||
      error_string[code] || 'unknown error';
  res.status(status).json({...ret, ...assign});
};

const setResponsePrototype = (req, res, next) => {
  res.fatal = (code, error, message) => {
    ends(res, code, code, message, {error: error});
    return res;
  };

  res.fail = (code, error, message) => {
    ends(res, 200, code, message, {error: error});
    return res;
  };

  res.ok = (data, override = {}) => {
    const ret = {data: data};
    ends(res, 200, 0, undefined, {...ret, ...override});
    return res;
  };

  res.gen422 = (key, err) => {
    return res.fail(422, [{name: key, message: err}]);
  };

  res.fail429 = (ttl) => {
    if(ttl < 5) ttl = 5;
    res.set({'Retry-After': ttl});
    return res.fatal(429, {'Retry-After': ttl})
  };

  next();
};

module.exports = setResponsePrototype;
