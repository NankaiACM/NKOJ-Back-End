const {SOLUTION_PATH, DATA_BASE, PROBLEM_DATA_PATH, PROBLEM_SPJ_PATH, PROBLEM_PATH} = require('../config/basic')
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
  const FILE_CODE_BASE = `${PATH_SOLUTION}/main.`
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
      compile_info: FILE_COMPILE_INFO,
      code_base: FILE_CODE_BASE
    }
  }
}

const getProblemStructure = function (pid) {
  const PATH_DATA = `${PROBLEM_DATA_PATH}/${pid}`
  const PATH_SPJ = `${PROBLEM_SPJ_PATH}/${pid}`
  const FILE_MD = `${PROBLEM_PATH}/${pid}.md`
  return {
    path: {
      data: PATH_DATA,
      spj: PATH_SPJ
    },
    file: {
      md: FILE_MD
    }
  }
}

module.exports = {
  getSolutionStructure,
  getProblemStructure,
  async unlinkTempFolder (sid) {
    fs.unlinkSync(getSolutionStructure(sid).path.temp + "/main")
  }
}
