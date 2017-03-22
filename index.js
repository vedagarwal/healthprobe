var _ = require('lodash');
var BPromise = require('bluebird');
var assert = require('assert');
var checkUtil = require('./checkUtil');

const Status = require('./enums').Status;
const Type = require('./enums').Type;

function getHealth(services, logger) {
  var healthStatus = {
    status: Status.AVAILABLE,
    timestamp: new Date(),
    message: '',
    services: []
  };

  return BPromise.map(services, function (service) {
    switch (service.type) {
      case Type.REST:
        return checkUtil.checkRestService(service);
      case Type.MONGO:
        return checkUtil.checkMongo(service);
      default:
        throw new Error('Service Type Not Supported');
    }
  }).then(function (results) {
    healthStatus.services = _.map(results, function (result) {
      return {
        service: result.serviceName,
        response: {
          status: result.status,
          timestamp: result.timestamp
        }
      };
    });

    var unavailable = _.some(results, function (result) {
      return result.status === Status.UNAVAILABLE;
    });
    healthStatus.status = unavailable ? Status.UNAVAILABLE : Status.AVAILABLE;

    if (logger) {
      logger.info('Overall Component Health Status : ' + healthStatus.status);
    } else {
      console.log('Overall Component Health Status : ' + healthStatus.status);
    }

    return healthStatus;
  }).catch(function (err) {
    if (logger) {
      logger.error(err);
    } else {
      console.error(err);
    }

    return healthStatus;
  });
}

/**
 *
 * @param configuration The service dependency configuration. Refer readme for sample structure.
 * @param intervalInSeconds Time interval to poll dependent services. Defaults to 30 seconds.
 * @param logger The logger used by the client. Must support info and error methods. Defaults to console.log.
 * @returns {Function} The handler that can be mounted at a suitable route.
 */
module.exports = function checkHealth(configuration, intervalInSeconds, logger) {
  // Input validation
  assert(configuration !== undefined, 'Invalid input: configuration is a required parameter');
  var restServicesValid = _.chain(configuration)
    .filter(function (service) {
      return service.type === Type.REST;
    })
    .every(function (service) {
      return !!service.healthCheckURI;
    });
  var mongoServicesValid = _.chain(configuration)
    .filter(function (service) {
      return service.type === Type.MONGO;
    })
    .every(function (service) {
      return !!service.dbConnection;
    });
  assert(restServicesValid && mongoServicesValid, 'Invalid input: configuration is not in expected format');

  var systemHealth = {
    status: Status.AVAILABLE,
    timestamp: new Date(),
    message: '',
    services: []
  };

  var interval = intervalInSeconds || 30;
  setInterval(function () {
    return getHealth(configuration, logger)
      .then(function (healthStatus) {
        systemHealth = healthStatus;
      });
  }, interval * 1000);

  return function (req, res) {
    if (systemHealth.status === Status.AVAILABLE) {
      systemHealth.message = 'All the components are up and running - Uptime : ' + process.uptime() + ' sec';
      res.status(200).json(systemHealth);
    } else {
      systemHealth.message = 'One or more component(s) not available';
      res.status(503).json(systemHealth);
    }
  };
};



