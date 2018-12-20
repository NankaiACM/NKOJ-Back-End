const router = require('express').Router()
const fs = require('fs')
const {VIDEO_PATH} = require('../config/basic')
const join=require('path').join

function findSync(startPath) {
    let result=[];
    function finder(path) {
        let files=fs.readdirSync(path);
        files.forEach((val,index) => {
            let fPath=join(path,val);
            let stats=fs.statSync(fPath);
            if(stats.isDirectory()) finder(fPath);
            if(stats.isFile()) result.push(fPath);
        });
    }
    finder(startPath);
    return result;
}

router.get('/list',async (req,res)=>{
    'use strict'
    let files=findSync(VIDEO_PATH)

    for(let i in files){
        files[i]=files[i].replace(VIDEO_PATH,"")
    }
    console.log(files)
    res.ok(files)
})

router.get('/:name', async (req, res) => {
    'use strict'
    const file = req.params.name
    if (fs.existsSync(`${VIDEO_PATH}/${file}`)) {
        res.sendFile(`${VIDEO_PATH}/${file}`)
    } else {
        res.fatal(404)
    }
})

module.exports = router
