const router = require('express').Router();
const fc = require('$lib/fc');

const captcha = require('$lib/captcha');
const {limit} = require('$lib/rate-limit');
const {add, login} = require('$interface/user');

router.post('/register', captcha.check('register'), limit('register'),
    fc.all(['nickname', 'password', 'email', 'school/optional', 'gender/optional']),
    async (req, res, next) => {
      const info = {...req.fcResult, ip: req.ip};

      try {
        const row = await add(req, info);
        if(!row.success) return res.gen422(row.error);
        login(req, row).then(() => {res.ok(row)})
      } catch (err) {
        res.fatal(520, err);
        return next(err);
      }
    });


module.exports = router;
