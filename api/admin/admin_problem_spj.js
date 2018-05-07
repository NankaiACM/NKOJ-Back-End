const router = require('express').Router()

const {PROBLEM_SPJ_PATH, TEMP_PATH} = require('../../config/basic')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const getExt = require('../../lib/extension').ext

router.post('/:pid', (req, res, next) => {
  if (!Number.isInteger(Number(req.params.pid))) return res.fatal(400)
  next()
})

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TEMP_PATH)
    }
  })
})

router.post('/:pid', upload.single('file'), (req, res, next) => {
  // TODO:
  const pid = req.params.pid
  const language = req.body.lang || 'cpp'
  const ext = getExt(language)
  const filename = `${PROBLEM_SPJ_PATH}/${pid}.${ext}`
  if (req.file) fs.rename(req.file.path, filename)
  else {
    if (!req.body.data) res.fail(400, 'neither file nor data was supplied')
    fs.writeFileSync(filename, req.body.data)
  }
  res.ok()
})

module.exports = router
