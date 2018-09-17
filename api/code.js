const router = require('express').Router();
const fc = require('$lib/form-check');
const fs = require('fs');
const db = require('$db');
const {getSolutionStructure} = require('$lib/judge');

router.get('/:pid', fc.all(['pid']), async (req, res, next) => {
  const pid = req.fcResult.pid;
  const ret = await db.query(
      'SELECT solution_id FROM solutions WHERE status_id = 107 AND problem_id = $1 LIMIT 1',
      [pid]);
  if (ret.rows.length === 0) return res.fail(404);

  const sid = ret.rows[0].solution_id;
  const struct = getSolutionStructure(sid);

  const codeFile = struct.file.code_base + 'cpp';
  try {
    const code = fs.readFileSync(codeFile, 'utf8');
    res.ok({code});
  } catch (e) {
    next(e);
  }
});

module.exports = router;
