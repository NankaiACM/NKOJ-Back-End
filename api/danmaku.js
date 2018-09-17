const router = require('express').Router();
const db = require('$db');

router.get('/', async (req, res) => {
  const ret = await db.query(
      'SELECT * FROM user_danmaku ORDER BY "when" desc LIMIT 100');
  res.ok(ret.rows.reverse());
});

module.exports = router;
