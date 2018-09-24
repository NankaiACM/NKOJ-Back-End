const router = require('express').Router();

const user = require('$interface/user');
const session_client = require('$lib/session').client;
const {require_perm} = require('$lib/permission');

router.use('/api', require_perm(), require('./api'));
router.use('/check', require('./check'));
router.use('/info', require_perm(), require('./info'));
router.use('/login', require('./login'));
router.get('/logout', async (req, res) => {
  user.logout(req);
  res.ok();
});
router.get('/session', async (req, res) => {
  const sessions = await session_client.hgetall(`session:${req.session.user}`);
  res.ok(sessions)
});
router.get('/register', require('./register'));
router.get('/update', require_perm(), require('./update'));


module.exports = router;
