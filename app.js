const {PUBLIC_PATH, DIST_PATH} = require('./config/basic')
const express = require('express')
const app = express()
const api = require('./api/api')
const prototype = require('./lib/prototype')

const logger = require('morgan')

const path = require('path')

app.set('trust proxy', '222.30.45.0/24, 127.0.0.1');

// Disable Header 'X-Powered-By' added by express.
app.disable('x-powered-by')

// DEV: request logger
app.use(logger(':date[iso] :remote-addr :method :url :status'))

// DEV: PPT JSON
app.set('json spaces', 4)

app.use(prototype.setResponsePrototype)

const exts = {
  'rar': 'no',
  'zip': 'no',
  '7z': 'no',
  'tar': 'no',
  'bz': 'no',
  'gz': 'no'
}

app.use('*', function (req, res, next) {
  const ext = path.extname(req.originalUrl)
  if (ext != '') {
    if (exts[ext]) {
      res.sendStatus(404)
    }
  }
  next()
})

app.use('/public', express.static(PUBLIC_PATH, {fallthrough: false}))

app.use(express.json({limit: '233kb'}))

// This defaults to 100kb
app.use(express.urlencoded({extended: true}))

app.use(require('./lib/apikey'))

// Dispatch to router
app.use('/api', api)

app.use('/', express.static(DIST_PATH, {fallthrough: true, setHeaders: function (res, path, stat) {
  res.set('X-Frame-Options', 'DENY')
}}))

app.get(/^.+$/, (req, res) => {
  res.set({
    // 'Content-Security-Policy': "default-src 'self' ; script-src 'self' 'unsafe-inline' 'unsafe-eval' ; style-src 'self' 'unsafe-inline' ; font-src 'self' data: ; img-src 'self' data: ; connect-src 'self' ws://222.30.51.68;",
    'Content-Security-Policy': "default-src 'self' ; script-src 'self' 'unsafe-inline' 'unsafe-eval' ; style-src 'self' 'unsafe-inline' ; font-src 'self' data: https: ; img-src 'self' data: ; connect-src 'self' wss://acm.nankai.edu.cn/ https://www.tuling123.com/openapi/api ws://acm.nankai.edu.cn/;",
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY'
  })
  res.sendFile(`${DIST_PATH}/index.html`, {acceptRanges: false})
})

app.use((req, res) => {
  res.fatal(404)
})

app.use((err, req, res, next) => {
  // DEV: remove
  if (!res.headersSent)
    res.fatal(err.status || 500, err.stack || err)
})

module.exports = app
