const redis = require('$lib/redis')('rate-limit');
const svgCaptcha = require('svg-captcha');
const optional = {
  login: true
};

const captcha_option = {
  size: 6,
  noise: 5,
  color: true,
  ignoreChars: '0Oo1Il',
  background: '#8899AA'
};

const middleware = type => async (req, res) => {
  if (optional[type]) {
    const ret = await redis.incr(`${req.ip}`);
    await redis.expire(`${req.ip}`, 60);
    if (ret && ret < 3) {
      req.session.captcha = {
        text: undefined,
        type: type
      };
      return res.json({})
    }
  }
  const captcha = svgCaptcha.create(captcha_option);
  req.session.captcha = {
    text: captcha.text.toLowerCase(),
    type: type
  };
  res.type('svg');
  res.status(200).send(captcha.data)
};

const captcha = type =>
  (req, res, next) => {
    const captcha_session = req.session.captcha;
    let captcha_client = req.body.captcha || req.params.captcha || req.query.captcha || '';
    captcha_client = captcha_client.toLowerCase();
    if (!captcha_session) return res.fail(233, [{name: 'captcha', message: 'required'}]);
    if (!captcha_session.type || captcha_session.type === type) {
      if (!captcha_client) captcha_client = undefined;
      if (captcha_client === captcha_session.text) {
        delete req.session.captcha;
        return next();
      }
    }
    delete req.session.captcha;
    res.fail(234, [{name: 'captcha', message: 'not match'}]);
  };

module.exports = {
  middleware,
  check: captcha
};
