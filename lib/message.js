const db = require('../database/db');
const sendMessage = async function(to, title, content) {
  return await db.query(
      'INSERT INTO messages (a, b, title, content) VALUES (NULL, $1, $2, $3) RETURNING *',
      [to, title, content]);
};
module.exports = {
  sendMessage,
};
