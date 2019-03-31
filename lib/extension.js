const language_ext = {
  c: 'c',
  cpp: 'c++',
  py: 'python',
  js: 'javascript',
  go: 'go',
  txt: 'text',
  pypy3: 'pypy3',
  [0]: 'c',
  [1]: 'cpp',
  [2]: 'js',
  [3]: 'py',
  [4]: 'go',
  [5]: 'txt',
  [6]: 'pypy3',
}

const handler = {
  get (target, name) {
    return name in target ? target[name] : 'code'
  }
}

const p = new Proxy(language_ext, handler)

module.exports = p
