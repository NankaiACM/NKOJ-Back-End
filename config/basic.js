const path = require('path')

const DATA_BASE = path.resolve(__dirname, '../data')

module.exports = {
  BASE_URL: 'http://111.231.98.20:8000',
  DATA_BASE: DATA_BASE,
  AVATAR_PATH: path.resolve(DATA_BASE, 'avatars'),
  PROBLEM_PATH: path.resolve(DATA_BASE, 'problems'),
  CONTEST_PATH: path.resolve(DATA_BASE, 'contests'),
  SOLUTION_PATH: path.resolve(DATA_BASE, 'solutions')
}
