const {Pool} = require('pg');
const config = require('$config/postgres');

const pool = new Pool(config);

pool.query('SELECT NOW() as now', (err, res) => {
  if (err) {
    console.log('Database connected error.', err);
    throw (err)
  }
  console.log(`Database connected at ${res.rows[0].now}`);
});

module.exports = pool;
