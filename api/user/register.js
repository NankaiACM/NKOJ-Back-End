const router = require('express').Router();
const fc = require('$lib/form-check');

const captcha = require('$lib/captcha');
const {limit} = require('$lib/rate-limit');
const {add, login} = require('$interface/user');

router.post('/', captcha.check('register'), limit('register'),
    fc.all(['nickname', 'password', 'email', 'school/optional', 'gender/optional']),
    async (req, res, next) => {
      const info = {...req.fcResult, ip: req.ip};

      try {
        const result = await add(req, info);
        if(!result.success) return res.gen422(result.error, 'has been taken');
        login(req, result.row).then(() => {res.ok(result.row)})
      } catch (err) {
        console.error(err);
        res.fatal(520, err);
        return next(err);
      }
    });


module.exports = router;
