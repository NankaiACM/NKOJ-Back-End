const router = require('express').Router();

const {logout, logoutAll} = require('$interface/user');

router.get('/', async (req, res) => {
  logout(req);
  res.ok();
});

router.get('/force', async (req, res) => {
  logoutAll(req);
  res.ok();
});

module.exports = router;
