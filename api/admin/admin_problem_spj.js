const router = require('express').Router()

const {getProblemStructure, getSolutionStructure, unlinkTempFolder} = require('../../lib/judge')
const {PROBLEM_SPJ_PATH, TEMP_PATH, DATA_BASE} = require('../../config/basic')
const multer = require('multer')
const path = require('path')
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
  console.log(filename);
  if (req.file) fs.renameSync(req.file.path, filename)
  else {
    if (!req.body.data) res.fail(400, 'neither file nor data was supplied')
    fs.writeFileSync(filename, req.body.data)
  }

  const config = {
    "debug": false, // [false]
    "base_path": DATA_BASE, // [/mnt/data]
    "lang": language_ext[ext], // <必填>，可以是 c, c++, javascript, python, go
    "code": filename, // [<base_path>/judge/<pid>.<ext>]
    "target": spj  // [<base_path>/judge/<pid>]
  }

  fs.writeFileSync(`${spj}.config`, JSON.stringify(config))
  const { code, stdout, stderr } = await spawn('docker', ['exec', '-i', 'judgecore', './compiler', `${spj}.config`]).catch(e => e);
  if (code === 0) {
    return res.ok()
  }
  return res.fail(500, JSON.parse(stdout), 'compile error');
})

module.exports = router
