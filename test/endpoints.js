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

  function addTarget (target, cb) {
    var opts = { encoding: 'json', method: 'POST' }
    var stream = servertest(server(), '/api/targets', opts, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 201, 'correct statusCode')
      t.end()
    })

    stream.end(JSON.stringify(target))
  }
})

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
  map(target, 1, getTarget, function (err) {
    t.not(err, 'should not error')
    t.end()
  })

  function getTarget (target, cb) {
    var opts = { encoding: 'json', method: 'GET' }
    servertest(server(), '/api/targets', opts, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 200, 'correct statusCode')
      t.deepEqual(res.body, target, 'targets should match')
      cb()
    })
  }
})

test.serial.cb('should get one target', function (t) {
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
  map(target, 1, getTarget, function (err) {
    t.not(err, 'should not error')
    t.end()
  })

  function getTarget (target, cb) {
    var opts = { encoding: 'json', method: 'GET' }
    servertest(server(), `/api/target/${target.id}`, opts, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 200, 'correct statusCode')
      t.deepEqual(res.body, target, 'target with id should match')
      cb()
    })
  }
})

test.serial.cb('specific target should not much', function (t) {
  const target = [{
    id: '3',
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
  map(target, 1, getTarget, function (err) {
    t.not(err, 'should not error')
    t.end()
  })

  function getTarget (target, cb) {
    var opts = { encoding: 'json', method: 'GET' }
    servertest(server(), `/api/target/${target.id}`, opts, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 404, 'Target with the provided id does not exist')
      t.deepEqual(res.body, { error: 'Target with the provided id does not exist' })
      cb()
    })
  }
})

test.serial.cb('should make request on target', function (t) {
  const target = [{
    geoState: 'ca',
    timestamp: '2018-07-19T13:28:59.513Z'
  }]
  map(target, 1, addTarget, function (err) {
    t.ifError(err, 'should not error')
    t.end()
  })

  function addTarget (target, cb) {
    var opts = { encoding: 'json', method: 'POST' }
    var stream = servertest(server(), '/route', opts, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 200, 'accept statusCode')
      t.end()
    })

    stream.end(JSON.stringify(target))
  }
})

test.serial.cb('should throw error when make request on target', function (t) {
  const target = [{

    geoState: 'caq',
    timestamp: '2018-07-19T08:28:59.513Z'

  }]
  map(target, 1, addTarget, function (err) {
    t.ifError(err, 'should not error')
    t.end()
  })

  function addTarget (target, cb) {
    var opts = { encoding: 'json', method: 'POST' }
    var stream = servertest(server(), '/route', opts, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 400, 'reject statusCode')
      t.end()
    })

    stream.end(JSON.stringify(target))
  }
})
