const router = require('express').Router();

const user = require('$interface/user');
const db = require('$db');
const fc = require('$lib/form-check');
const captcha = require('$lib/captcha');

router.post('/login', captcha.check('login'), fc.all(['user', 'password']),
    async (req, res) => {
      const query = 'SELECT * FROM users WHERE (lower(nickname) = $1 OR email = $1) AND password = hash_password($2) LIMIT 1';
      const {user, password} = req.fcResult;

      const row = await db.find(query, [user, password]);
      if (row)
        db.postLogin(row, req, res);
      else
        res.fail(422, [
          {name: 'name', message: 'might be wrong'}, {
            name: 'password',
            message: 'might be wrong',
          }], 'login failed');
    });

module.exports = router;
