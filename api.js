const { log } = require('@nodebug/logger')
const jsonfile = require('jsonfile')
const request = require('request-promise-native')
const path = require('path')
const fs = require('fs')

function RestAPIObject(options) {
  try {
    const jsonFile = path.resolve(options.specPath)
    if (fs.existsSync(jsonFile)) {
      this.spec = { ...jsonfile.readFileSync(jsonFile) }
    } else {
      log.error(`Spec file not found at path ${options.specPath}`)
      throw new ReferenceError(
        `Spec file not found at path ${options.specPath}`,
      )
    }
  } catch (err) {
    log.error(`Error while reading api spec from path ${options.specPath}`)
    throw err
  }
  this.jwtPayload = options.jwtPayload
  this.server = options.server
  this.resource = this.server + this.spec.endpoint
  this.requestBody = this.spec.body
}

RestAPIObject.prototype.getResource = function () {
  return this.resource
}

RestAPIObject.prototype.setResource = function (resource) {
  this.resource = resource
}

RestAPIObject.prototype.send = async function () {
  log.debug(`Sending request :\n${JSON.stringify(this.request)}`)

  try {
    const response = await request(this.request)
    this.parseResponse(response)
    log.info('Request returned response.')
  } catch (error) {
    this.parseResponse(error)
    log.info('Request failed.')
  }

  log.info(`Response Status code ${this.statusCode}`)
  return this.statusCode
}

RestAPIObject.prototype.delete = function (body) {
  if (body !== undefined) {
    this.requestBody = { ...body }
  }
  this.request = {
    method: 'DELETE',
    uri: this.resource,
    body: this.requestBody,
    resolveWithFullResponse: true,
    json: true,
  }

  return this.send()
}

RestAPIObject.prototype.parseResponse = function (response) {
  if (response.statusCode !== undefined) {
    this.statusCode = response.statusCode
    this.statusMessage = response.statusMessage
    this.responseBody = response.body
    this.response = response
  } else {
    log.error('Status code is not defined')
    log.debug(response)
  }
}

//   TestRail.prototype._callAPI = function (method, url, queryVariables, body, callback) {
//     if(queryVariables != null) {
//       url += '&' + qs.stringify(queryVariables);
//     }

//     var requestArguments = {
//       rejectUnauthorized: false, //added this line to solve Error: unable to verify the first certificate] code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
//       uri: url,
//       headers: {
//         'content-type': 'application/json',
//         'accept': 'application/json'
//       },
//       rejectUnauthorized: false
//     };

//     if(body != null) {
//       requestArguments.body = body;
//     }

//     if (typeof callback === 'function') {
//       return request[method](requestArguments, function(err, res, body) {
//         if(err) {
//           return callback(err);
//         }
//         var responseBody = body === '' ? JSON.stringify({}) : body;
//         if(res.statusCode != 200) {
//           var errData = body;
//           try {
//             errData = JSON.parse(body);
//           } catch (err) {
//             return callback(err.message || err);
//           }
//           return callback(errData, res);
//         }
//         return callback(null, res, JSON.parse(responseBody));
//       }).auth(this.user, this.password, true);
//     }
//     else {
//       return new Promise(function (resolve, reject) {
//         return request[method](requestArguments, function(err, res, body) {
//           if(err) {
//             return reject(err);
//           }
//           var responseBody = body === '' ? JSON.stringify({}) : body;
//           if(res.statusCode != 200) {
//             var errData = body;
//             try {
//               errData = JSON.parse(body);
//             } catch (err) {
//               return reject({ message: err.message || err });
//             }
//             return reject({ message: errData, response: res });
//           }
//           return resolve({ response: res, body: JSON.parse(responseBody) });
//         }).auth(this.user, this.password, true);
//       }.bind(this));
//     }
//   };

module.exports = RestAPIObject
