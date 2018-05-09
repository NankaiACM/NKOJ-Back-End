const WebSocket = require('ws')
const striptags = require('striptags')
const db = require('../database/db')
const session = require('./session')

const port = 8001

let currentConnection = 0
const wss = new WebSocket.Server({
  port: port,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    concurrencyLimit: 10,
    threshold: 1024
  },
  maxPayload: 10000
})

setInterval(function ping () {
  wss.clients.forEach(function each (ws) {
    if (ws.isAlive === false)
      return ws.terminate()
    ws.send(Buffer.from([0x1, 0x2]))
    ws.isAlive = false
    ws.ping()
  })
}, 30000)

const formMessage = (isAdmin, color, user, message) => {
  color = Math.random() * 16
  const buf = Buffer.concat([
    Buffer.from([0x02, isAdmin ? 0x01 : 0x00, color % 16]),
    Buffer.from([user.length]),
    Buffer.from(user),
    Buffer.from([message.length]),
    Buffer.from(message)
  ])
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

wss.on('connection', function connection (ws, req) {
  ws.binaryType = 'arraybuffer'
  currentConnection++
  ws.isAlive = true
  session(req, {}, function (err, _) {
    if (!err) {
      ws.username = req.session.nickname || req.connection.remoteAddress
      ws.ipaddr = req.connection.remoteAddress
      ws.user_id = req.session.user || null
    }
  })
  ws.on('pong', () => ws.isAlive = true)
  ws.on('message', function incoming (message) {
    if (typeof message !== 'string')
      return ws.terminate()
    if (!ws.username)
      return ws.send(formMessage(1, 2, 'System', 'please wait...'))
    if (message.length > 30 || message.length === 0)
      return ws.send(formMessage(1, 2, 'System', 'too long...'))
    db.query('insert into user_danmaku (message, user_id, ipaddr) values ($1, $2, $3)', [message, ws.user_id, ws.ipaddr])
    wss.clients.forEach(function each (client) {
      if (client.readyState === WebSocket.OPEN) {
        message = striptags(message, ['span', 'strong', 'color', 'font'])
        client.send(formMessage(0, 0, ws.username, message))
      }
    })
  })
  ws.on('close', () => currentConnection--)
  ws.send(formMessage(1, 2, 'Online', currentConnection.toString()))
})

console.log(`Danmaku server started at port ${port}`)
