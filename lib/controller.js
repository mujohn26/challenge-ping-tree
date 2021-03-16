var redis = require('redis')
var client = redis.createClient()

const createTarget = (req, res) => {
  try {
    client.set(
      'target',
      JSON.stringify(req.body),
      (err, reply) => {
        if (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({ message: 'target was not created successfully' })
          ) // callback to log errors
        } else {
          res.writeHead(201, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({ message: 'target is created succesfully' })
          )
        }
      }
    )
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error }))
  }
}

const getAllTargets = (req, res) => {
  try {
    client.get('target', (err, obj) => {
      if (!obj || err) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error: 'We can not get all target'
          })
        )
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(JSON.parse(obj)))
      }
    })
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error }))
  }
}

const getAllTargetById = (req, res, id) => {
  try {
    client.get('target', (err, obj) => {
      if (!obj || err) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error: 'Target with the provided id does not exist'
          })
        )
      } else {
        const isIdEqual = (JSON.parse(obj).id === id)
        if (isIdEqual) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(JSON.parse(obj)))
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              error: 'Target with the provided id does not exist'
            })
          )
        }
      }
    })
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error }))
  }
}

const makeRequest = (req, res) => {
  try {
    client.get('target', (err, obj) => {
      if (!obj || err) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error: 'Target with the provided id does not exist'
          })
        )
      } else {
        const data = [JSON.parse(obj)]
        const { timestamp, geoState } = req.body
        const date = new Date(timestamp)
        const hours = date.getUTCHours()
        const selectedTargets = data.filter(
          (target) =>
            target.accept.geoState.$in.includes(geoState) &&
              target.accept.hour.$in.includes(`${hours}`) &&
              parseInt(target.maxAcceptsPerDay) > 0

        )

        if (selectedTargets.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              decision: 'Reject'
            })
          )
        } else {
          if (selectedTargets.length === 1) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(
              JSON.stringify({
                decision: 'Accept',
                url: selectedTargets[0].url
              })
            )
            const maxAcceptsPerDay = parseInt(selectedTargets[0].maxAcceptsPerDay) - 1
            const obj = {
              id: selectedTargets[0].id,
              url: selectedTargets[0].url,
              value: selectedTargets[0].value,
              maxAcceptsPerDay,
              accept: selectedTargets[0].accept
            }

            client.set(
              'target',
              JSON.stringify(obj),
              (err, reply) => {
                if (err) {
                  console.log(err)
                }
              })
          } else {
            let target
            selectedTargets.map((data, index) => {
              if (index === 1) {
                target = data
              } else {
                if (parseInt(data.value) > parseInt(target.value)) {
                  target = data.value
                }
              }
            })

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(
              JSON.stringify({
                decision: 'Accept',
                url: target.url
              })
            )

            const maxAcceptsPerDay = parseInt(target.maxAcceptsPerDay) - 1
            const obj = {
              id: target.id,
              url: target.url,
              value: target.value,
              maxAcceptsPerDay,
              accept: target.accept
            }

            client.set(
              'target',
              JSON.stringify(obj),
              (err, reply) => {
                if (err) {
                  console.log(err)
                }
              })
          }
        }
      }
    })
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error }))
  }
}

module.exports = { createTarget, getAllTargets, getAllTargetById, makeRequest }
