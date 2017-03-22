var rp = require('request-promise');
var BPromise = require('bluebird');
const Status = require('./enums').Status;

exports.checkRestService = function checkRestService(service) {
  var options = {
    rejectUnauthorized: false,
    simple: true,
    resolveWithFullResponse: false,
    json: true,
    uri: service.healthCheckURI,
    method: 'GET',
    headers: {}

  };
  if (service.auth) {
    options.headers['Authorization'] = service.auth;
  }

  return rp(options).then(function (response) {
      response.serviceName = service.serviceName;
      return response;
    }).catch(function (err) {
      if (err.statusCode === 503) {
        err.response.body.serviceName = service.serviceName;
        return err.response.body;
      } else {
        var serviceRes = {
          status: Status.UNAVAILABLE,
          timestamp: new Date()
        };
        serviceRes.serviceName = service.serviceName;
        return serviceRes;
      }
    });
};

exports.checkMongo = function checkMongo(service) {
  return new BPromise(function (resolve) {
    var resp = {
      timestamp: new Date(),
      serviceName: service.serviceName
    };

    var collection = service.dbConnection.collection('system.js');
    collection.findOne({}, function (error) {
      if (error) {
        resp.status = Status.UNAVAILABLE;
      } else {
        resp.status = Status.AVAILABLE;
      }
      resolve(resp);
    });
  });
};
