const {spawn, exec} = require('child_process')
const path = require('path')
let diff2html = require('diff2html').Diff2Html

const callback = (resolve) => (error, stdout, stderr) => {
  console.log(stdout)
  console.error(stderr)
  resolve({
    stderr: stderr,
    stdout: stdout,
    error: error
  })
}

module.exports = (workingDir) => {
  return {
    init () {
      'use strict'
      return new Promise((resolve, reject) => {
        'use strict'
        const git = exec(`git init`, {cwd: path.resolve(__dirname, workingDir)}, callback(resolve))
      })
    },

    commit (file, message) {
      return new Promise((resolve, reject) => {
        'use strict'
        const git = exec(`git add ${file} && git commit -m "${message || 'No message.'}"`, {cwd: path.resolve(__dirname, workingDir)}, callback(resolve))
      })
    },

    commitAll (message) {
      return new Promise((resolve, reject) => {
        'use strict'
        const git = exec(`git add . && git commit -am "${message || 'No message.'}"`, {cwd: path.resolve(__dirname, workingDir)}, callback(resolve))
      })
    },

    diff (file) {
      'use strict'
      return new Promise((resolve, reject) => {
        'use strict'
        const git = exec(`git diff HEAD^ HEAD -- ${file || '.'}`, {cwd: path.resolve(__dirname, workingDir)}, callback(resolve))
      })
    }
  }
}
