const { spawn } = require('child_process');

function spawnAsync(command, args, options) {
  const child = spawn(command, args, options);
  return new Promise(((resolve, reject) => {
    let stderr = '';
    const _reject = (reason) => {
      console.error(command, args, 'rejected', reason);
      return reject(reason);
    };
    child.stderr.on('data', (data) => {
      stderr += data;
      console.log(command, `stderr: ${data}`);
    });
    child.addListener('error', reject);
    child.addListener('exit', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        _reject({ code, error: stderr });
      }
    });
  }));
}

module.exports = {
  spawn: spawnAsync,
};
