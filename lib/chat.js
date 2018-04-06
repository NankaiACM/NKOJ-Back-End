const WebSocket = require('ws')
const striptags = require('striptags')
const sessionParser = require('./session-store').sessionParser
let currentConnection = 0
const randomName = ['小明', '张张', '王红', '李玲', 'Alice', 'Bob', 'Jack', 'Pony', '子狐', '奥巴马', '特朗普', '雪风', '罗德尼', '胡德']
const randomMessage = ['五目小哥哥太帅啦(星星眼', '五目小哥哥那么强，好想让他生猴子', '五目小哥哥~~~~', '五目小哥哥到底会不会喜欢人家呢&gt;.&lt;',
  '真的好想要五目小哥哥呀QwQ', '五目小哥哥编程能力一级棒!', '是呀是呀我觉得你说的太对啦', '哎呀是五目小哥哥 摔倒(′д｀ )…彡…彡', '真想要和五目小哥哥多待一会的说',
  '你们这群人太可怕了，五目小哥哥明明在我床上']
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
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    clientMaxWindowBits: 10,       // Defaults to negotiated value.
    serverMaxWindowBits: 10,       // Defaults to negotiated value.
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
    if (!err) ws.username = req.session.nickname || req.connection.remoteAddress
    else ws.username = 'anonymous'
  })
  ws.on('pong', () => ws.isAlive = true)
  ws.on('message', function incoming (message) {
    if (typeof message !== 'string') {
      ws.terminate()
      return
    }
    if (!ws.username) return ws.send('System: initializing session, wait')
    if (message.length > 30) return ws.send('System: The message is too long.')
    wss.clients.forEach(function each (client) {
      if (client.readyState === WebSocket.OPEN) {
        message = striptags(message, ['span', 'strong', 'color', 'font'])
        client.send(`${ws.username}: ${message}`)
      }
    })
  })
  ws.on('close', () => currentConnection--)
  console.log(`current connection: ${currentConnection}`)
  ws.send(`System: Hi, welcome. current connection is: ${currentConnection}`)
  ws.send(`SunriseFox: 五目小哥哥太强啦，我要嫁给他QwwwwwQ`)
})
