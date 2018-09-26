const router = require('express').Router();

const fc = require('$lib/form-check');

const {require_perm, CHANGE_PROFILE} = require('$lib/permission');

const upload = require('$interface/file');
const {update, avatar} = require('$interface/user');

router.post('/',
    require_perm(CHANGE_PROFILE),
    upload('avatar'),
    fc.all([
      'nickname/optional',
      'email/optional',
      'gender/optional',
      'qq/optional',
      'phone/optional',
      'real_name/optional',
      'school/optional',
      'password/optional',
      'words/optional']),
    async (req, res) => {

      // TODO: test avatar

      const form = req.fcResult;
      const ret = {};
      if(req.file){
        avatar({filename: req.file.filename});
        ret.avatar = 'changed';
      }
      try {
        const {success, error, row} = await update(req, form);
        if(!success) return res.gen422(error, 'not available');
        if(row) {
          Object.keys(row).forEach((k) => {
            if (row[k]) ret[k] = 'changed';
          });
        }
        if(Object.keys(ret).length)
          return res.ok(ret);
        else
          return res.fail(422, 'nothing was changed');
      } catch (err) {
        return res.fatal(520, err);
      }
    });

module.exports = router;
