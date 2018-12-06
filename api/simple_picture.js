const router = require('express').Router()
const fs = require('fs')
const {PICTURE_PATH} = require('../config/basic')

router.get('/:name', async (req, res) => {
    'use strict'
    const file = req.params.name
    if (fs.existsSync(`${PICTURE_PATH}/${file}`)) {
        res.sendFile(`${PICTURE_PATH}/${file}`)
    } else {
        res.fatal(404)
    }
})

module.exports = router
