const router = require('express').Router();
const {require_limit, apply_limit} = require('$lib/rate-limit');
const {email} = require('$interface/user');
const {require_perm} = require('$lib/permission');

router.get('/send', require_perm(), async (req, res) => {
  await require_limit('sendmail')(req, res, async () => {
    const result = await email.sendVerification(req);
    if (result.success) {
      await apply_limit('sendmail', req);
      return res.ok(result.key);
    }
    return res.fail(result.error, 'try alter method');
  });
});

router.get('/email', async (req, res) => {
  const {hash, code} = req.query;
  const result = await email.verify({hash, code});
  if (result) {
    delete req.session.perm;
    return res.ok();
  }
  return res.fail(404);
});

module.exports = router;
