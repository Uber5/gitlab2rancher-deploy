const request = require('request')

function getAuthorizationHeader() {
  if (!process.env.RANCHER_ACCESS_KEY || !process.env.RANCHER_SECRET_KEY) {
    throw new Error('Rancher credentials not available in environment')
  }
  const credentials = `${ process.env.RANCHER_ACCESS_KEY }:${ process.env.RANCHER_SECRET_KEY }`
  const encoded = new Buffer(credentials).toString('base64')
  return `Basic ${ encoded }`
}

function doREST(options) {
  return new Promise((resolve, reject) => {
    if (typeof options === 'string') options = { url: options };
    const params = Object.assign({}, {
      method: 'GET',
      headers: {
        authorization: getAuthorizationHeader()
      }
    }, options)
    console.log('about to request', params)
    request(params, function(err, response, body) {
      if (err) return reject(err);
      if (response.statusCode >= 300) {
        throw new Error(`get, unexpected statusCode ${ response.statusCode }, body=${ body }`)
      }
      const parsed = JSON.parse(body)
      console.log('parsed response', parsed)
      return resolve(parsed)
    })
  })
}

function get(url) {
  return doREST(url)
}

function post(options) {
  if (typeof options === 'string') options = { url: options };
  options = Object.assign({}, options, { method: 'POST' })
  return doREST(options)
}

function waitUntilUpgradeAvailable(serviceUrl) {
  return get(serviceUrl)
  .then(status => {
    if (status.actions.upgrade) {
      return status
    } else {
      return new Promise((resolve) => {
        setTimeout(() => resolve(waitUntilUpgradeAvailable(serviceUrl)), 2000)
      })
    }
  })
}

function upgrade(serviceUrl) {
  return get(serviceUrl)
  .then(status => { // finish previous upgrade, if necessary
    console.log('launchConfig', status.launchConfig)
    if (status.actions.finishupgrade) {
      return post({ url: status.actions.finishupgrade })
        .then(r => waitUntilUpgradeAvailable(serviceUrl))
        .then(r => get(serviceUrl))
    } else {
      return status
    }
  })
  .then(status => {
    if (!status.actions.upgrade) {
      throw new Error(`Upgrade action not available for ${ status.links.self }. Is service active?`)
    }
    return status
  })
  .then(status => post({
    url: status.actions.upgrade,
    body: JSON.stringify({
      inServiceStrategy: {
        startFirst: true,
        launchConfig: status.launchConfig
      },
      toServiceStrategy: {
      }
    })
  }))
}

module.exports = upgrade
