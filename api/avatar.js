const redis = require('$ib/redis')('user');
const db = require('$db');
const router = require('express').Router();
const fs = require('fs');
const {AVATAR_PATH} = require('$config/basic');
const avatar = async (key) => {
  'use strict';
  if (Number.isInteger(Number(key)))
    return await redis.get(`avatar:${key}`);
  else {
    const {user_id} = await db.only('SELECT user_id FROM users WHERE nickname = $1', [key]);
    if (user_id)
      return await redis.get(`avatar:${user_id}`);
  }
  return 'default.png';
};

router.get('/:key', async (req, res) => {
  'use strict';
  const key = req.params.key;
  const file = await avatar(key);
  if (fs.existsSync(`${AVATAR_PATH}/${file}`)) {
    res.sendFile(`${AVATAR_PATH}/${file}`);
  } else {
    res.sendFile(`${AVATAR_PATH}/default.png`);
  }
});

module.exports = router;
