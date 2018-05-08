const gcc = '/opt/rh/devtoolset-7/root/usr/bin/gcc'
const Sandbox='./judge/Sandbox'
const router = require('express').Router()
const fs = require('fs')
const solution_path=''

const lang_type={
  'g++':'cpp',
  'gcc':'c',
  'python2':'py',
  'python3':'py',
  'java':'java',
  'go':'go'
}
const code={
  'problem_id': 1001,
  'userid': 1,
  'codebody': '',
  'lauguange': 'cpp'
}
const build_cmd = {
  "gcc"    : "gcc main.c -o main -Wall -lm -O2 -std=c99 --static -DONLINE_JUDGE",
  "g++"    : "g++ main.cpp -O2 -Wall -lm --static -DONLINE_JUDGE -o main",
  "java"   : "javac Main.java",
  "ruby"   : "ruby -c main.rb",
  "perl"   : "perl -c main.pl",
  "pascal" : 'fpc main.pas -O2 -Co -Ct -Ci',
  "go"     : '/opt/golang/bin/go build -ldflags "-s -w"  main.go',
  "lua"    : 'luac -o main main.lua',
  "python2": 'python2 -m py_compile main.py',
  "python3": 'python3 -m py_compile main.py',
  "haskell": "ghc -o main main.hs"
}


router.post('/', (req, res) => {
  const problem = req.body.p
  const lang = req.body.lang
  const code = req.body.code

  fs.writeFile(`${solution_path}/${problem}.${lang_tpye[lang]}`, code, (err) => {
      console.log(err)
      console.log(fs.readFileSync(`${solution_path}/${problem}.cpp`).toString())
   })

   res.end()

 })


module.exports = router
