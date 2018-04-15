const language_ext = {
  c: 'c',
  cpp: 'cpp',
  python2: 'py',
  python3: 'py',
  java: 'java'
}

module.exports = {
  ext (ext) {
    return language_ext[ext] || 'unknown'
  }
}
