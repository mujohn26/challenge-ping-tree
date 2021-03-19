var URL = require('url')
var http = require('http')
var cuid = require('cuid')
var Corsify = require('corsify')
var sendJson = require('send-data/json')
var ReqLogger = require('req-logger')
var healthPoint = require('healthpoint')
var HttpHashRouter = require('http-hash-router')

var redis = require('./redis')
var version = require('../package.json').version

var router = HttpHashRouter()
var logger = ReqLogger({ version: version })
var health = healthPoint({ version: version }, redis.healthCheck)
var cors = Corsify({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, accept, content-type'
})

router.set('/favicon.ico', empty)
var controller = require('./controller')
var { BodyParser } = require('../helper/bodyParser')

module.exports = function createServer () {
  return http.createServer(
    cors(handler)
  )
}

const handler = async (req, res) => {
  const pathName = req.url
  const parts = pathName.split('/').slice(1)
  if (req.url === '/health') { return health(req, res) } else if (req.url === '/api/targets' && req.method === 'POST') {
    await BodyParser(req)
    controller.createTarget(req, res)
  } else if (req.url === '/api/targets' && req.method === 'GET') {
    controller.getAllTargets(req, res)
  } else if (parts[0] === 'api' && parts[1] === 'target' && parts[2] !== '' && req.method === 'GET') {
    const id = parts[2]
    controller.getAllTargetById(req, res, id)
  } else if (parts[0] === 'api' && parts[1] === 'target' && parts[2] !== '' && req.method === 'POST') {
    await BodyParser(req)
    const id = parts[2]
    controller.updateTargetById(req, res, id)
  } else if (req.url === '/route' && req.method === 'POST') {
    await BodyParser(req)
    controller.makeRequest(req, res)
  } else {
    req.id = cuid()
    logger(req, res, { requestId: req.id }, function (info) {
      info.authEmail = (req.auth || {}).email
      console.log(info)
    })
    router(req, res, { query: getQuery(req.url) }, onError.bind(null, req, res))
  }
}

function onError (req, res, err) {
  if (!err) return

  res.statusCode = err.statusCode || 500
  logError(req, res, err)

  sendJson(req, res, {
    error: err.message || http.STATUS_CODES[res.statusCode]
  })
}

function logError (req, res, err) {
  if (process.env.NODE_ENV === 'test') return

  var logType = res.statusCode >= 500 ? 'error' : 'warn'

  console[logType]({
    err: err,
    requestId: req.id,
    statusCode: res.statusCode
  }, err.message)
}

function empty (req, res) {
  res.writeHead(204)
  res.end()
}

function getQuery (url) {
  return URL.parse(url, true).query // eslint-disable-line
}
