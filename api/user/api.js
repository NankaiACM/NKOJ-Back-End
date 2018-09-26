const router = require('express').Router();
const {api} = require('$interface/user');
const fc = require('$lib/form-check');

router.get('/', async (req, res) => {
  const user = req.session.user;
  const apis = await api.list(user);
  res.ok(apis);
});

router.get('/apply/:api_name?', fc.all(['api_name/optional']), async (req, res, next) => {
  let name = req.fcResult.api_name || null;
  const user = req.session.user;
  let ret = await api.generate(user, name);
  if(ret.retry)
    ret = await api.generate(user, name);
  if(ret.success) res.ok({key: ret.key, secret: ret.secret});
  else if(ret.retry) res.fail(409, 'failed to generate a key after tried twice');
  else res.fail(422, ret.error);
});

router.get('/:operate/:key', async (req, res, next) => {
  const op = req.params.operate;
  const key = req.params.key;

  let ret;
  const params = [req.session.user, key];
  switch (op) {
    case 'enable':
      ret = await api.enable(...params);
      break;
    case 'disable':
      ret = await api.disable(...params);
      break;
    case 'delete':
    case 'remove':
      ret = await api.remove(...params);
      break;
    default:
      return next()
  }
  if (!ret) return res.fail(404);
  return res.ok(ret);
});

router.get('/rename/:key/:api_name', fc.all(['api_name']), async (req, res) => {
  const key = req.params.key;
  const name = req.fcResult.api_name;
  const user = req.session.user;
  const ret = await api.rename(user, key, name);
  if (!ret) return res.fail(404);
  return res.ok(ret);
});

module.exports = router;
