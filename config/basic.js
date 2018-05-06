const path = require('path')

const DATA_BASE = path.resolve(__dirname, '/var/www/data')

module.exports = {
  BASE_URL: 'http://oj.vampire.rip',
  DATA_BASE: DATA_BASE,
  AVATAR_PATH: path.resolve(DATA_BASE, 'avatars'),
  DIST_PATH: path.resolve(DATA_BASE, '/var/www/front/dist'),
  PROBLEM_PATH: path.resolve(DATA_BASE, 'problems'),
  PROBLEM_DATA_PATH: path.resolve(DATA_BASE, 'problem_data'),
  PROBLEM_SPJ_PATH: path.resolve(DATA_BASE, 'problem_spj'),
  PUBLIC_PATH: path.resolve(DATA_BASE, 'public'),
  TEMP_PATH: path.resolve(DATA_BASE, 'temp'),
  CONTEST_PATH: path.resolve(DATA_BASE, 'contests'),
  SOLUTION_PATH: path.resolve(DATA_BASE, 'solutions')
}
