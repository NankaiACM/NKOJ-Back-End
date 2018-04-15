const router = require('express').Router()
const {PUBLIC_PATH} = require('../config/basic')
const multer = require('multer')
const path = require('path')

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, PUBLIC_PATH)
    },
    filename: (req, file, cb) => {
      console.log(file, file.originalname, path.extname(file.originalname))
      cb(null, `${Date.now().toString(36)}${Math.floor(Math.random() * 100).toString(36)}${path.extname(file.originalname)}`)
    }
  })
})

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.fail(1)
  res.ok({file: req.file.path, url: `/public/${req.file.filename}`})
})

module.exports = router
