const router = require('express').Router();

const login = require('./user_login');
const register = require('./user_register');
const user_check = require('./user_check');
const update = require('./user_update');
const api_key = require('./user_api');
const problems = require('./user_problems');
const contest = require('./user_contest');
const db = require('../../database/index');
const fc = require('../../lib/form-check');
const {require_perm} = require('../../lib/permission');

router.use(login);
router.use(register);
router.use(user_check);
router.use(update);
router.use(contest);
router.use(problems);
router.use('/key', require_perm(), api_key);

module.exports = router;
