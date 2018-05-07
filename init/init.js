const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')

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

const db_file = path.resolve(__dirname, '../config/postgres.js')
const path_file = path.resolve(__dirname, '../config/path.js')

app.get('/init', (req, res) => {
  if (fs.existsSync(db_file))
    res.locals.database = fs.readFileSync(db_file)
  res.locals.db_template = fs.readFileSync(path.resolve(__dirname, 'db_template.js'))
  if (fs.existsSync(path_file))
    res.locals.path = fs.readFileSync(path_file)
  res.locals.path_template = fs.readFileSync(path.resolve(__dirname, 'path_template.js'))
  res.render(path.resolve(__dirname, './init.ejs'))
})


app.post('/init', (req, res) => {
  const type = req.body.act
  const value = req.body.value.trim()
  let ret
  try {
    ret = evalInContext(value)
  } catch (e) {
    return res.send('Syntax error. Must contain module.exports={}')
  }
  if (!ret.module || !ret.module.exports)
    return res.send('Not node exports. Must contain module.exports={}')
  switch (type) {
    case 'db':
      fs.writeFileSync(db_file, value)
      break
    case 'path':
      fs.writeFileSync(path_file, value)
      break
  }
  res.send('Ok. Server will shut down. If you are using pm2, it will help you restart otherwise you have to do it manually.')
  process.exit(-1)
})

app.use((req, res) => {
  res.redirect(`/init`)
})

module.exports = app
