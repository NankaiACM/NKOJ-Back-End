const router = require('express').Router();

const {query} = require('$interface/user');
const validator = require('validator');
const {check} = require('$lib/form-check');

router.get('/:type/:what', async (req, res) => {
  const type = req.params.type;
  const value = req.params.what;
  if (type === 'email') {
    if (validator.isEmail(value)) {
      const result = await query({email: value});
      if (result) return res.gen422('email', 'is not available');
      return res.ok();
    }
  } else if (type === 'nickname') {
    // TODO: test
    const ret = check(req, {value: type});
    if (!ret) {
      const result = await query({nickname: value});
      if (result) return res.gen422('nickname', 'is not available');
      return res.ok();
    }
  }
  return res.fail(400);
});

module.exports = router;
