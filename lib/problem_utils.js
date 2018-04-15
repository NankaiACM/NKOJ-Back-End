const generateFileString = (json) => {
  const strArr = []
  Object.keys(json).forEach((k, v) => {
    strArr.push(`$$${k}$$\n${json[k]}\n$$${k}$$`)
  })
  console.log('test', strArr.join())
  return strArr.join()
}

const splitFileString = (str) => {
  const o = {}
  const r = /\$\$(.+?)\$\$(?:\n)([\s\S]+?)(?:\$\$\1\$\$)/g
  while (item = r.exec(str)) o[item[1]] = item[2]
  console.log(o)
  return o
}

module.exports = {
  generateFileString: generateFileString,
  splitFileString: splitFileString
}
