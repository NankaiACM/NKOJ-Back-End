const router = require('express').Router();

router.get('/unsubscribe/:hash/:email', async (req, res) => {
  'use strict';
  const email = Buffer.from(req.params.email, 'base64').toString();
  const hash = req.params.hash;
  const cb = result => {
    if (result.success) return res.ok(result);
    return res.fail(1, result);
  };
  banEmail(hash, email, false, cb);
});

module.exports = router;
