const router = require('express').Router()
const {PROBLEM_DATA_PATH, TEMP_PATH} = require('../../config/basic')
const multer = require('multer')
const AdmZip = require('adm-zip')
const fs = require('fs')
const path = require('path')

router.post('/:pid', (req, res, next) => {
  if (!Number.isInteger(Number(req.params.pid)))
    return res.fatal(400)
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
  const pid = req.params.pid
  if (!req.file) return res.fatal(400, 'no zip file found')

  const data_path = `${PROBLEM_DATA_PATH}/${pid}`
  if (fs.existsSync(data_path)) {
    fs.readdirSync(data_path).forEach(function (file) {
      const curPath = data_path + '/' + file
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        // TODO:
      } else {
        fs.unlinkSync(curPath)
      }
    })
  } else fs.mkdirSync(data_path)

  const zip = new AdmZip(req.file.path)
  const zipEntries = zip.getEntries() // an array of ZipEntry records

  let i = 0

  zipEntries.forEach(function (zipEntry) {
    if (path.extname(zipEntry.entryName) === '.in') {
      const out = zip.getEntry(`${path.basename(zipEntry.entryName, '.in')}.out`)
      if (out) {
        i++
        fs.writeFileSync(`${data_path}/${i}.in`, zipEntry.data)
        fs.writeFileSync(`${data_path}/${i}.out`, out.data)
      }
    }
  })

  res.ok({files: i})
  fs.unlinkSync(req.file.path)
})

module.exports = router
