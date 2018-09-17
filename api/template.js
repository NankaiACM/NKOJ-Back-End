const router = require('express').Router();

const user = require('$interface/user');
const db = require('$db');
const fc = require('$lib/form-check');
const captcha = require('$lib/captcha');

module.exports = router;
