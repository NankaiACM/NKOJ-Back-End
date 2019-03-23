const { spawn } = require('child_process');

function spawnAsync(command, args, options) {
  const child = spawn(command, args, options);
  return new Promise(((resolve, reject) => {
    let stderr = '';
    let stdout = '';
    const _reject = (reason) => {
      console.error(command, args, 'rejected', reason);
      return reject(reason);
    };
    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.stderr.on('data', (data) => {
      stderr += data;
    });
    child.addListener('error', reject);
    child.addListener('exit', (code) => {
      if (code === 0) {
        resolve({code, stdout, stderr});
      } else {
        _reject({code, stdout, stderr});
      }
    });
  }));
}

module.exports = {
  spawn: spawnAsync,
};
