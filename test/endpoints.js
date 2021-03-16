process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')
var map = require('map-limit')

var server = require('../lib/server')

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('should add target', function (t) {
  const target = [{
    id: '1',
    url: 'http://example.com',
    value: '0.50',
    maxAcceptsPerDay: '10',
    accept: {
      geoState: {
        $in: ['ca', 'ny']
      },
      hour: {
        $in: ['13', '14', '15']
      }
    }
  }]
  map(target, 1, addTarget, function (err) {
    t.ifError(err, 'should not error')
    t.end()
  })

  function addTarget (buyer, cb) {
    var opts = { encoding: 'json', method: 'POST' }
    var stream = servertest(server(), '/api/targets', opts, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 201, 'correct statusCode')
      t.end()
    })

    stream.end(JSON.stringify(buyer))
  }
})

// test.serial.cb('should not add invalid target', function (t) {
//   const req={

//   }
//   var opts = { encoding: 'json', method: 'POST' }
//   var stream = servertest(server(), '/api/targets', opts, function (err, res) {
//     t.falsy(err, 'no error')
//     t.is(res.statusCode >= 400, 'error statusCode')
//     t.end()
//   })

//   stream.end(JSON.stringify(req))})

test.serial.cb('should get targets', function (t) {
  const target = [{
    id: '1',
    url: 'http://example.com',
    value: '0.50',
    maxAcceptsPerDay: '10',
    accept: {
      geoState: {
        $in: ['ca', 'ny']
      },
      hour: {
        $in: ['13', '14', '15']
      }
    }
  }]
  map(target, 1, getBuyer, function (err) {
    t.not(err, 'should not error')
    t.end()
  })

  function getBuyer (target, cb) {
    var opts = { encoding: 'json', method: 'GET' }
    servertest(server(), '/api/targets', opts, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 200, 'correct statusCode')
      t.deepEqual(res.body, target, 'buyer should match')
      cb()
    })
  }
})
