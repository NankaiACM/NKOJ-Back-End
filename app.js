const {PUBLIC_PATH, DIST_PATH} = require('$config/basic');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const logger = require('morgan');

// DEV: remove
// const proxy = require('http-proxy-middleware');
// app.use('/old', proxy({target: 'http://220.113.20.2/', changeOrigin: false}));
// app.use('/nkcoj', proxy({target: 'http://220.113.20.2/', changeOrigin: false}));

// Disable Header 'X-Powered-By' added by express.
app.disable('x-powered-by');

// DEV: request logger
app.use(logger('dev'));

// DEV: pretty-print JSON output
app.set('json spaces', 4);

app.use(require('$lib/prototype'));

app.use('/public', express.static(PUBLIC_PATH, {fallthrough: false}));

app.use(bodyParser.json({limit: '233kb'}));

// This defaults to 100kb
app.use(bodyParser.urlencoded({extended: true}));

app.use(require('$lib/session-middleware'));

// Dispatch to router
app.use('/api', require('$api'));

app.use('/', express.static(DIST_PATH, {fallthrough: true}));

app.get(/^.+$/, (req, res) => {
  // res.set({
  //   'Content-Security-Policy': 'default-src \'self\' ; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' ; style-src \'self\' \'unsafe-inline\' ; font-src \'self\' data: ; img-src \'self\' data: ; connect-src \'self\' ws://acm.nankai.edu.cn; report-uri https://sunrisefox.report-uri.com/r/d/csp/enforce',
  //   'Referrer-Policy': 'same-origin',
  //   'X-XSS-Protection': '1; report=https://sunrisefox.report-uri.com/r/d/csp/enforce',
  // });
  res.sendFile(`${DIST_PATH}/index.html`, {acceptRanges: false});
});

app.use((req, res) => {
  res.fatal(404);
});

app.use((err, req, res, next) => {
  // DEV: remove
  if (!res.headersSent)
    res.fatal(err.status || 500, err.stack || err);
});

module.exports = app;
