const multer = require('multer');
const {AVATAR_PATH} = require('$config');
const {check_perm, CHANGE_AVATAR} = require('$lib/permission');
const avatarConfig = {
  multer: {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, AVATAR_PATH);
      },
      filename: (req, file, cb) => {
        cb(null, md5(file.fieldname + '-' + Date.now()) +
            path.extname(file.originalname));
      },
    }),
    fileSize: '2048000',
    files: 1,
    fileFilter: (req, file, cb) => {
      if (!check_perm(CHANGE_AVATAR)) cb(403, false);
      const mimetype = file.mimetype;
      if (!mimetype.startsWith('image/')) {
        cb('unknown mimetype: ' + mimetype, false);
      }
      else cb(null, true);
    },
  },
  field: 'avatar',
  optional: true,
  ignoreError: false,
  resize: [512, 512],
};
const handler = {
  avatar: avatarConfig,
};

module.exports = (type, field) => async (req, res, next) => {
  if (typeof handler[type] !== 'object')
    return next(new Error('wrong server argument'));

  const upload = multer(handler[type].multer).single(field || type);
  const {optional, ignoreError, resize} = handler[type];
  let rejected = false;
  let filename;
  await new Promise(
      (resolve, reject) => {
        try {
          upload(req, res, resolve);
        } catch (e) {
          reject(e);
        }
      },
  ).then(() => {
    if (req.file) {
      let sharp;
      try {
        sharp = require('sharp');
      } catch (err) {
        sharp = undefined;
      }
      if (sharp && resize) {
        filename = `sharped.${req.file.filename}`;
        sharp(req.file.path).
            resize(...resize).
            max().
            jpeg({quality: 60}).
            toFile(filename);
        fs.unlinkSync(req.file.path);
      } else {
        filename = req.file.filename;
      }
    } else {
      rejected = !optional;
    }
  }).catch(err => {
    try {
      fs.unlinkSync(req.file.path);
    } catch (_) { }
    console.error(err);
    rejected = ignoreError && err;
  });
  if (rejected)
    return typeof rejected === 'string'
        ? res.gen422(field || type, rejected)
        : res.fail(1, 'file not found');
  if(!req.file) return next();
  if(filename === undefined)
    return next(new Error('filename is undefined'));
  req.file.filename = filename;
  // TODO: test
  req.file.path = req.file.destination + '/' + filename;
  return next();
};
