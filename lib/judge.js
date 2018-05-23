const {SOLUTION_PATH, DATA_BASE} = require('../config/basic')
const fs = require('fs')

const deleteFolderRecursive = function (path) {
  if (path.indexOf('temp') < 0) throw 'something wrong?'
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      const curPath = path + '/' + file
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}

const getSolutionStructure = function (sid) {
  const PATH_SOLUTION = `${SOLUTION_PATH}/${sid}`
  if (!fs.existsSync(PATH_SOLUTION))
    fs.mkdirSync(PATH_SOLUTION)
  const PATH_TEMP = `${PATH_SOLUTION}/temp`
  const PATH_EXEC_OUT = `${PATH_SOLUTION}/execout`

  const FILE_RESULT = `${PATH_TEMP}/result`
  const FILE_TIME = `${PATH_TEMP}/time`
  const FILE_MEMORY = `${PATH_TEMP}/memory`
  const FILE_DETAIL = `${PATH_TEMP}/detail`
  const FILE_COMPILE_INFO = `${PATH_SOLUTION}/main.cmpinfo`
  return {
    path: {
      solution: PATH_SOLUTION,
      temp: PATH_TEMP,
      exec_out: PATH_EXEC_OUT
    },
    file: {
      result: FILE_RESULT,
      time: FILE_TIME,
      memory: FILE_MEMORY,
      detail: FILE_DETAIL,
      compile_info: FILE_COMPILE_INFO
    }
  }
}

module.exports = {
  getSolutionStructure,
  async unlinkTempFolder (sid) {
    deleteFolderRecursive(getSolutionStructure(sid).path.temp)
  }
}
