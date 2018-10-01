const router = require('express').Router();
const {check} = require('$lib/form-check');
const {info, query} = require('$interface/user');

router.get('/:user?', async (req, res) => {
  let uid = req.params.user || req.session.user;
  if (!Number.isInteger(Number(uid))) {
    const ret = await check(req, {user: 'nickname'});
    if (ret) return res.gen422(ret);
    const nickname = req.fcResult.user;
    uid = await query({nickname});
  }
  return res.ok(await info(uid));
});

module.exports = router;
