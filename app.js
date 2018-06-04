const {PUBLIC_PATH, DIST_PATH} = require('./config/basic')
const express = require('express')
const app = express()
const api = require('./api/api')
const prototype = require('./lib/prototype')

const bodyParser = require('body-parser')
const logger = require('morgan')

// DEV: remove
const proxy = require('http-proxy-middleware')
app.use('/old', proxy({target: 'http://220.113.20.2/', changeOrigin: false}))
app.use('/nkcoj', proxy({target: 'http://220.113.20.2/', changeOrigin: false}))
// DEV: temporary workaround
app.get('/new', (req, res) => {
  res.redirect(301, '/')
})

// Disable Header 'X-Powered-By' added by express.
app.disable('x-powered-by')
app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': "default-src 'self' ; script-src 'self' 'unsafe-inline' 'unsafe-eval' ; style-src 'self' 'unsafe-inline' ; font-src 'self' data: ; img-src 'self' data: ; reflected-xss block; referrer origin; report-uri https://sunrisefox.report-uri.com/r/d/csp/enforce"
  })
  next()
})

// DEV: request logger
app.use(logger('dev'))

// DEV: PPT JSON
app.set('json spaces', 4)

app.use(prototype.setResponsePrototype)

app.use('/public', express.static(PUBLIC_PATH, {fallthrough: false}))

app.use(bodyParser.json({limit: '233kb'}))

// This defaults to 100kb
app.use(bodyParser.urlencoded({extended: true}))

app.use(require('./lib/apikey'))

// Dispatch to router
app.use('/api', api)

app.use('/', express.static(DIST_PATH, {fallthrough: true}))

app.get(/^.+$/, (req, res) => {
  res.sendFile(`${DIST_PATH}/index.html`, {acceptRanges: false})
})

app.use((req, res) => {
  res.fatal(404)
})

app.use((err, req, res) => {
  // DEV: remove
  if (!res.headersSent)
    res.fatal(err.status || 500, err.stack || err)
})

module.exports = app
