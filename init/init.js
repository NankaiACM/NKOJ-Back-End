const express = require('express')
const app = express()
const path = require('path')

app.get('/init', (req, res) => {
  res.sendFile(path.resolve(__dirname, './init.html'))
})

app.post('/init', (req, res) => {
  // TODO: init data
})

app.use((req, res) => {
  res.redirect('/init')
})

module.exports = app
