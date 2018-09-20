const router = require('express').Router();

const {query} = require('$interface/user');
const fc = require('$lib/form-check');
const captcha = require('$lib/captcha');

router.post('/login', captcha.check('login'), fc.all(['user', 'password']),
    async (req, res) => {
      const {user, password} = req.fcResult;
      const row = query({user, password});
      if (row) {
        const {login} = require('$interface/session');
        login(row, req);
        res.ok();
      } else
        res.gen422('form', 'might be wrong')
    });

module.exports = router;
