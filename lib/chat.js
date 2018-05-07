const WebSocket = require('ws')
const striptags = require('striptags')
const db = require('../database/db')
const sessionParser = require('./session-store').sessionParser
let currentConnection = 0
const wss = new WebSocket.Server({
  port: 8001,
  perMessageDeflate: {
    zlibDeflateOptions: { // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Below options specified as default values.
    concurrencyLimit: 10,          // Limits zlib concurrency for perf.
    threshold: 1024               // Size (in bytes) below which messages
    // should not be compressed.
  },
  maxPayload: 10000
})

setInterval(function ping () {
  wss.clients.forEach(function each (ws) {
    if (ws.isAlive === false) {
      return ws.terminate()
    }
    ws.send(Buffer.from([0x1, 0x2, 0x3]))
    ws.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on('connection', function connection (ws, req) {
  currentConnection++
  ws.isAlive = true
  sessionParser(req, {}, function (err, _) {
    if (!err) {
      ws.username = req.session.nickname || req.connection.remoteAddress
      ws.ipaddr = req.connection.remoteAddress
      ws.user_id = req.session.user || null
    }
  })
  ws.on('pong', () => ws.isAlive = true)
  ws.on('message', function incoming (message) {
    if (typeof message !== 'string') {
      ws.terminate()
      return
    }
    if (!ws.username) return ws.send('System: initializing session, please wait')
    if (message.length > 30 || message.length === 0) return ws.send('System: The message is too long.')
    db.query('insert into user_danmaku (message, user_id, ipaddr) values ($1, $2, $3)', [message, ws.user_id, ws.ipaddr])

    wss.clients.forEach(function each (client) {
      if (client.readyState === WebSocket.OPEN) {
        message = striptags(message, ['span', 'strong', 'color', 'font'])
        client.send(`${ws.username}: ${message}`)
      }
    })
  })
  ws.on('close', () => currentConnection--)
  console.log(`current connection: ${currentConnection}`)
  ws.send(`Online: ${currentConnection}`)
})
