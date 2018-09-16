const language_ext = {
  c: 'c',
  cpp: 'cpp',
  python2: 'py',
  python3: 'py',
  java: 'java',
};

const handler = {
  get(target, name) {
    return name in target ? target[name] : 'unknown';
  },
};

const p = new Proxy(language_ext, handler);

module.exports = p;
