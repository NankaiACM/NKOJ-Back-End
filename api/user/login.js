const router = require('express').Router();

const {query, login} = require('$interface/user');
const fc = require('$lib/form-check');
const captcha = require('$lib/captcha');

router.post('/', captcha.check('login'), fc.all(['user', 'password']),
    async (req, res) => {
      const {user, password} = req.fcResult;
      const row = await query({user, password});
      if (row) {
        login(req, row).then((info)=> res.ok(row));
      } else
        res.gen422('form', 'might be wrong');
    });

module.exports = router;
