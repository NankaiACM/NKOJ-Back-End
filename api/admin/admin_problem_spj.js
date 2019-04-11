const router = require('express').Router()

const {getProblemStructure} = require('../../lib/judge')
const {TEMP_PATH} = require('../../config/basic')
const multer = require('multer')
const fs = require('fs')
const language_ext = require('../../lib/extension')
const {spawn} = require('../../lib/spawn')

router.post('/:pid', (req, res, next) => {
  if (!Number.isInteger(Number(req.params.pid)))
    return res.fatal(422)
  next()
})

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TEMP_PATH)
    }
  })
})

router.post('/:pid', upload.single('file'), async (req, res, next) => {
  const pid = req.params.pid
  const language = req.body.lang || 1
  const ext = language_ext[language]
  const spj = getProblemStructure(pid).path.spj
  const filename = `${spj}.${ext}`
  if (req.file) fs.renameSync(req.file.path, filename)
  else {
    if (!req.body.data) res.fail(400, 'neither file nor data was supplied')
    fs.writeFileSync(filename, req.body.data)
  }

  const config = {
    "lang": language_ext[ext],
    "pid": ''+pid,
  }

  fs.writeFileSync(`${spj}.config`, JSON.stringify(config))
  const { code, stdout, stderr } = await spawn('docker', ['exec', '-i', 'judgecore', './compiler', `${spj}.config`]).catch(e => e);
  if (code === 0) {
    return res.ok()
  }
  return res.fail(500, JSON.parse(stdout), 'compile error');
})

module.exports = router
