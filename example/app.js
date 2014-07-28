var path = require('path')
var bp = require('..')

bp(function(app) {
  app.use(function* (next) {
    //this.body = '22222'
    yield next
  })
}, __dirname)
