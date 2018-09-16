const {spawn, exec} = require('child_process');
const path = require('path');
let diff2html = require('diff2html').Diff2Html;

const callback = (resolve) => (error, stdout, stderr) => {
  console.log(stdout);
  console.error(stderr);
  resolve({
    stderr: stderr,
    stdout: stdout,
    error: error,
  });
};

module.exports = (workingDir) => {
  return {
    init() {
      return new Promise((resolve, reject) => {
        const git = exec(`git init`, {cwd: path.resolve(__dirname, workingDir)},
            callback(resolve));
      });
    },

    add(file) {
      return new Promise((resolve, reject) => {
        const git = exec(`git add ${file}`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    commit(message) {
      return new Promise((resolve, reject) => {
        const git = exec(`git commit -m "${message || 'No message.'}"`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    commitFile(file, message) {
      return new Promise((resolve, reject) => {
        const git = exec(
            `git add ${file} && git commit -m "${message || 'No message.'}"`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    commitAll(message) {
      return new Promise((resolve, reject) => {
        const git = exec(
            `git add . && git commit -am "${message || 'No message.'}"`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    diff(file) {
      return new Promise((resolve, reject) => {
        const git = exec(`git diff HEAD^ HEAD -- ${file || '.'}`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    install() {
      return new Promise((resolve, reject) => {
        const npm = exec(`npm install`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    log(policy) {
      return new Promise((resolve, reject) => {
        const git = exec(`git log ${policy}`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    pull(policy) {
      return new Promise((resolve, reject) => {
        if (policy && policy !== 'theirs' && policy !== 'ours') reject(
            'policy must be "theirs" or "ours"');
        const git = exec(`git pull ${policy ? `-X${policy}` : ''}`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    removeUntracked() {
      return new Promise((resolve, reject) => {
        const git = exec(`git clean -fd`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    resetAll() {
      return new Promise((resolve, reject) => {
        const git = exec(`git reset --hard && git clean -fd`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },

    rebuild() {
      return new Promise((resolve, reject) => {
        const npm = exec(`npm run build`,
            {cwd: path.resolve(__dirname, workingDir)}, callback(resolve));
      });
    },
  };
};
