const router = require('express').Router();

const user = require('$interface/user');
const session_client = require('$lib/session').client;

router.use('/check', require('./check'));
router.use('/info', require_perm(), require('./info'));
router.use('/login', require('./login'));
router.get('/logout', async (req, res) => {
  // TODO: remove from database
  delete req.session;
  res.ok();
});
router.get('/session', async (req, res) => {
  const sessions = await session_client.hgetall(`session:${req.session.user}`);
  res.ok(sessions)
});

module.exports = router;
