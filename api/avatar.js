const router = require('express').Router();
const fs = require('fs');
const {avatar} = require('$interface/user');

router.get('/:key', async (req, res) => {
  'use strict';
  const key = req.params.key;
  const file = await avatar(req, key);
  return res.sendFile(file);
});

module.exports = router;
