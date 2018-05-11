const {FRONT_END_PATH, BACK_END_PATH} = require('../config/basic')
const git = {
  front: require('../lib/git')(FRONT_END_PATH),
  back: require('../lib/git')(BACK_END_PATH)
}
const {require_perm, SUPER_ADMIN} = require('../lib/permission')
const router = require('express').Router()

router.get('/', async (req, res) => {
  const front_log = await git.front.log('-n 1 --no-decorate')
  const back_log = await git.back.log('-n 1 --no-decorate')
  res.ok({
    frontend: front_log.stdout,
    backend: back_log.stdout
  })
})

router.get('/rebuild/:type', require_perm(SUPER_ADMIN), async (req, res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8')
  switch (req.params.type) {
    case 'front':
      res.send('resetAll:\n')
      res.send(git.front.resetAll())
      res.send('\npull:\n')
      res.send(git.front.pull())
      res.send('\nnpm_install:\n')
      res.send(git.front.install())
      res.send('\nnpm_build:\n')
      res.send(git.front.rebuild())
      res.send('\nfinished.\n')
      break
    case 'backend':
      res.send('resetAll:\n')
      res.send(git.back.resetAll())
      res.send('\npull:\n')
      res.send(git.back.pull())
      res.send('\nnpm_install:\n')
      res.send(git.front.install())
      res.send('\nfinished. will restart.\n')
      process.exit(-1)
      break
    default:
      res.send('type unknown\n')
  }
})

module.exports = router
