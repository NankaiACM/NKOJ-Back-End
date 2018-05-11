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
      res.write('reset:\n')
      res.flush()
      res.write(await git.front.resetAll())
      res.flush()
      res.write('\npull:\n')
      const fres = await git.front.pull()
      res.write(fres)
      res.flush()
      if (fres.stdout === 'Already up to date.\n')
        return res.end('\nNothing to be done.\n')
      res.write('\nnpm_install:\n')
      res.flush()
      res.write(await git.front.install())
      res.flush()
      res.write('\nnpm_build:\n')
      res.flush()
      res.write(await git.front.rebuild())
      res.flush()
      res.end('\nfinished.\n')
      break
    case 'backend':
      res.write('reset:\n')
      res.flush()
      res.write(git.back.resetAll())
      res.flush()
      res.write('\npull:\n')
      const bres = await git.front.pull()
      res.write(bres)
      res.flush()
      if (bres.stdout === 'Already up to date.\n')
        return res.end('\nNothing to be done.\n')
      res.write('\nnpm_install:\n')
      res.flush()
      res.write(git.front.install())
      res.flush()
      res.write('\nfinished, will restart.\n')
      process.exit(-1)
      break
    default:
      res.send('type unknown\n')
  }
})

module.exports = router
