const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const test = require('../test/fc')

app.set('view engine', 'ejs')
app.use(express.static(path.resolve(__dirname, 'public')))
app.use(bodyParser.urlencoded({extended: true}))

const evalInContext = (scr) => {
  const mask = {}
  for (p in this) {
    // noinspection JSUnfilteredForInLoop
    mask[p] = undefined
  }
  mask.module = {};
  (new Function('with(this) { ' + scr + '}')).call(mask)
  return mask
}

const files = {
  session: path.resolve(__dirname, '../config/session.js'),
  db: path.resolve(__dirname, '../config/postgres.js'),
  path: path.resolve(__dirname, '../config/path.js'),
  mail: path.resolve(__dirname, '../config/mail.js'),
  rsa: path.resolve(__dirname, '../config/rsa.js')
}

app.get('/init', (req, res) => {

  Object.keys(files).forEach((k) => {
    if (fs.existsSync(files[k]))
      res.locals[k] = fs.readFileSync(files[k])
    res.locals[`${k}_template`] = fs.readFileSync(path.resolve(__dirname, `${k}_template.js`))
  })

  res.render(path.resolve(__dirname, './init.ejs'), {files: files})
})


app.post('/init', (req, res) => {
  const type = req.body.type
  const keys = Object.keys(files)
  if (!keys.includes(type))
    return res.json({code: 400, message: `requested type '${type}' is not in the list`, keys: keys})

  const value = req.body.value.trim()
  let ret
  try {
    ret = evalInContext(value)
  } catch (e) {
    return res.json({code: 400, message: 'error when eval the file', error: e.stack || e})
  }
  if (!ret.module || !ret.module.exports)
    return res.json({code: 400, message: 'must contain module.exports'})
  try {
    fs.writeFileSync(files[type], value)
  } catch (e) {
    return res.json({code: 500, message: 'error when write the file', error: e.stack || e})
  }
  res.send({code: 0})
})

app.get('/restart', (req, res) => {
  res.json({code: 0})
  process.exit(-1)
})

app.use('/test', test)

app.use((req, res) => {
  res.redirect(`/init`)
})

app.use((err, req, res) => {
  res.json(err)
})

module.exports = app
