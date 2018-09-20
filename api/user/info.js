const router = require('express').Router();
const {check} = require('$lib/form-check');
const validator = require('validator');
const {info, query} = require('$interface/user');

router.get('/:user', async (req, res, next) => {
  try {
    let user_id;
    if(!validator.isInt(req.params.user)) {
      // TODO: test
      check(req, {user: 'nickname'});
      const nickname = req.fcResult.user;
      user_id = query(nickname);
    }
    else
      user_id = req.params.user;
    return res.ok(await info(user_id));
  } catch (e) {
    return res.fail(404);
  }
});

module.exports = router;
