const router = require('express').Router();
const {check} = require('$lib/form-check');
const {info, query} = require('$interface/user');

router.get('/:user?', async (req, res) => {
  try {
    let uid = req.params.user || req.session.user;
    console.error('uid',uid);
    if(!Number.isInteger(Number(uid))) {
      const ret = await check(req, {user: 'nickname'});
      if(ret) return res.gen422(ret);
      const nickname = req.fcResult.user;
      uid = await query({nickname});
      console.log(uid);
    }
    return res.ok(await info(uid));
  } catch (e) {
    console.error(e);
    return res.fail(404);
  }
});

module.exports = router;
