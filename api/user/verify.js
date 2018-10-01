const router = require('express').Router();
const {require_limit, apply_limit} = require('$lib/rate-limit');
const {email, info, group} = require('$interface/user');
const {retrieve} = require('$interface/email');
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
    return res.ok();
  }
  return res.fail(404);
});

router.get('/fetch', async (req, res) => {
  const uid = req.session.user;
  const {subject} = req.query;
  const {email} = (await info(uid, 'email'));
  const result = await retrieve(email, subject);
  if (result) {
    group.add(uid, 'emailVerified');
    return res.ok();
  }
  return res.fail(428);
});

module.exports = router;
