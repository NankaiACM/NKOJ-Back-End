const router = require('express').Router();
const captcha = require('$lib/captcha');

router.get('/:type*?', (req, res) => {
  const type = req.params.type;
  return captcha.middleware(type)(req, res);
});

module.exports = router;
