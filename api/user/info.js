const router = require('express').Router();
const db = require('$db');
const user = require('$interface/user');

router.get('/:nickname', fc.all(['nickname']), async (req, res) => {
  const nickname = req.fcResult.nickname;\
  try {
    const {user_id} = await db.only(
        'SELECT user_id from user_nick where lower(nickname) = lower($1)',
        [nickname]);
    const ret = await user.query(user_id);
    return res.ok(ret);
  } catch (e) {
    return res.fail(404);
  }
});

router.get('/:uid(\\d+)?', async (req, res) => {
  const uid = Number(req.params.uid) || req.session.user;
  try {
    const ret = await user.query(uid);
    return res.ok(ret);
  } catch (e) {
    return res.fail(404);
  }
});

module.exports = router;
