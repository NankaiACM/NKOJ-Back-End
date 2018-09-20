const pool = require('$db/init');
const session = require('$lib/session');
const index = {};

index.pool = () => pool;

index.query = (text, params) => {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    pool.query(text, params, (err, res) => {
      const end = Date.now() - start;
      if (err) {
        console.log(`Database query [${text}, ${params}] failed in ${end} ms`);
        console.log(err);
        reject(err);
      } else {
        console.log(`Database query [${text}, ${params}] finished in ${end} ms`);
        resolve(res);
      }
    });
  });
};

index.only = (text, params) => {
  return index.query(text, params).then(({rows}) => {
    if(rows.length !== 1) return {};
    return rows[0];
  })
};

index.find = (text, params) => {
  return index.query(text, params).then(({rows}) => {
    if(rows.length !== 1) return false;
    return rows[0];
  })
};

index.joinQueryArr = (key) => {
  'use strict';
  const arr = [];
  arr.push(key.join(', '));
  arr.push(arr.map(function(k, i) {return '$' + (i + 1);}).join(','));
  return arr;
};

module.exports = index;
