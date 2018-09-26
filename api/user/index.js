const router = require('express').Router();

const session = require('$interface/session');
const {require_perm} = require('$lib/permission');

router.use('/api', require_perm(), require('./api'));
router.use('/check', require('./check'));
router.use('/info', require_perm(), require('./info'));
router.use('/login', require('./login'));
router.use('/logout', require('./logout'));
router.use('/session', async (req, res) => {
  const sessions = await session.list(req.session.user);
  res.ok(sessions)
});
router.use('/register', require('./register'));
router.use('/update', require_perm(), require('./update'));
router.use('/verify', require('./verify'));

module.exports = router;
