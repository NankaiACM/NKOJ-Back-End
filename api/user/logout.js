const router = require('express').Router();

const {logout, logoutAll} = require('$interface/user');

router.delete('/', async (req, res) => {
  logout(req);
  res.ok();
});

router.delete('/force', async (req, res) => {
  logoutAll(req);
  res.ok();
});

module.exports = router;
