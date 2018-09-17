const WebSocket = require('ws');
const striptags = require('xss');
const db = require('$db');
const session = require('$lib/session');
const {check_perm, SUPER_ADMIN} = require('$lib/permission');
const {FRONT_END_PATH, BACK_END_PATH} = require('$config/basic');
const git = {
  front: require('$lib/git')(FRONT_END_PATH),
  back: require('$lib/git')(BACK_END_PATH),
};

// TODO: Need Test
const ignoreError = err => console.error('ignore', err);

const formMessage = (isAdmin, color, user, message) => {
  color = Math.random() * 16;
  const buf = Buffer.concat([
    Buffer.from([0x02, isAdmin ? 0x01 : 0x00, color % 16]),
    Buffer.from([Buffer.byteLength(user)]),
    Buffer.from(user),
    Buffer.from([Buffer.byteLength(message)]),
    Buffer.from(message),
  ]);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
};

// DEV: just for fun
const rebuild = async (ws, type) => {
  switch (type) {
    case undefined:
    case 'frontend':
      ws.send(formMessage(1, 0, 'SYSTEM', 'Resetting..'), ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', (await git.front.resetAll()).stdout),
          ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', 'Pulling..'), ignoreError);
      const fres = await git.front.pull();
      ws.send(formMessage(1, 0, 'SYSTEM', fres.stdout), ignoreError);
      if (fres.stdout === 'Already up to date.\n')
        return ws.send(formMessage(1, 0, 'SYSTEM', 'Nothing to be done.'),
            ignoreError);

      ws.send(formMessage(1, 0, 'SYSTEM', 'NPM Installing..'), ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', (await git.front.install()).stdout),
          ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', 'Webpack Building..'), ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', (await git.front.rebuild()).stdout),
          ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', 'finished.'), ignoreError);
      break;
    case 'backend':
      ws.send(formMessage(1, 0, 'SYSTEM', 'Resetting..'), ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', (await git.back.resetAll()).stdout),
          ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', 'Pulling..'), ignoreError);
      const bres = await git.back.pull();
      ws.send(formMessage(1, 0, 'SYSTEM', bres.stdout), ignoreError);
      if (bres.stdout === 'Already up to date.\n')
        return ws.send(formMessage(1, 0, 'SYSTEM', 'Nothing to be done.'),
            ignoreError);

      ws.send(formMessage(1, 0, 'SYSTEM', 'NPM Installing..'), ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', (await git.back.install()).stdout),
          ignoreError);
      ws.send(formMessage(1, 0, 'SYSTEM', 'finished. restarting server..'),
          ignoreError);
      setTimeout(() => process.exit(-1), 1000);
      break;
    default:
      ws.send(formMessage(1, 0, 'SYSTEM', 'unknown type'), ignoreError);
  }
};

module.exports = (server) => {
  let currentConnection = 0;
  const wss = new WebSocket.Server({
    server,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      concurrencyLimit: 10,
      threshold: 1024,
    },
    maxPayload: 10000,
  });

  setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false)
        return ws.terminate();
      ws.send(Buffer.from([0x1, 0x2]), ignoreError);
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', function connection(ws, req) {
    ws.binaryType = 'arraybuffer';
    currentConnection++;
    ws.isAlive = true;
    session(req, {}, async function(err, _) {
      if (!err) {
        const ipaddr = req.connection.remoteAddress.endsWith('127.0.0.1')
            ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
            : req.connection.remoteAddress;
        ws.username = req.session.nickname || ipaddr;
        ws.ipaddr = ipaddr;
        ws.user_id = req.session.user || null;
        ws.isAdmin = await check_perm(req, SUPER_ADMIN);
      }
    });
    ws.on('error', err => console.error('caught', err));
    ws.on('pong', () => ws.isAlive = true);
    ws.on('message', async function incoming(message) {
      if (typeof message !== 'string')
        return ws.terminate();
      message = message.trim();
      if (!ws.username)
        return ws.send(formMessage(1, 2, 'System', 'please wait...'),
            ignoreError);
      if (ws.isAdmin) {
        if (message.startsWith('rebuild')) return await rebuild(ws,
            message.split(' ')[1]);
      } else if (message.length > 30 || message.length === 0)
        return ws.send(formMessage(1, 2, 'System', 'too long...'),
            ignoreError);
      db.query(
          'insert into user_danmaku (message, user_id, ipaddr) values ($1, $2, $3)',
          [message, ws.user_id, ws.ipaddr]);
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          message = striptags(message);
          client.send(formMessage(ws.isAdmin, 0, ws.username, message));
        }
      });
    });
    ws.on('close', () => currentConnection--);
    ws.send(formMessage(1, 2, 'Online', currentConnection.toString()),
        ignoreError);
  });
};
