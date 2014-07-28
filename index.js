var fs = require('fs')
var yaml = require('js-yaml')
var path = require('path')
var co = require('co')
var koa = require('koa')
var app = koa()
var debug = require('debug')
var error = console.error

module.exports = function(fn, dirname) {

  var read = function(pathname) {
    return function(cb) {
      fs.readFile(path.resolve(dirname, pathname), function(err, buf) {
        if (buf) buf = buf + ''
        cb(err, buf)
      })
    }
  }

  co(function* () {

    var config = yield read('config.yml')
    config = yaml.load(config)
    app.config = config
    app.port = process.argv[2] || config.port || 80
    addMiddleware()

  })(function(err) {
    if (err) {
      error('init failure!', '\n', err)
      return
    }
    fn(app)
    app.listen(app.port, function() {
      console.log('Server listen on %d', app.port)
    })
  })

  function addMiddleware() {
    var mw = {}
    'logger static'.split(' ').forEach(function(x) {
      mw[x] = require('koa-' + x)
    })
    var logger = require('koa-logger')
    app.use(mw.logger())
    app.use(mw.static(path.resolve(dirname, 'static')))
    app.use(template(path.resolve(dirname, 'views'), {
      map: {
        html: 'jade'
      }
    }))
  }

  function template(basedir, opt) {
    // add default support
    var render = require('co-views')(basedir, opt)
    return function* (next) {
      yield next
      var p = this.path.substr(1)
      this.body = yield render(this.path.substr(1), this.locals)
    }
  }

}
