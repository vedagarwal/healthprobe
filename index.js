var _ = require('lodash');
var rp = require('request-promise');
var BPromise = require('bluebird');
var schedule = require('node-schedule');

const UNAVAILABLE = 'UNAVAILABLE';
const AVAILABLE = 'AVAILABLE';

function checkRestService(service) {
    var options = {
        rejectUnauthorized: false,
        simple: true,
        resolveWithFullResponse: false,
        json: true,
        uri: service.healthCheckURI,
        method: 'GET',
        headers: {
            'Authorization': service.auth
        }
    };
    return rp(options).then(function (response) {
        response.serviceName = service.serviceName;
        return response;
    }).catch(function (err) {
        if(err.statusCode === 503){
            err.response.body.serviceName = service.serviceName;
            return err.response.body;
        }else{
            var serviceRes = {
                status: UNAVAILABLE,
                timestamp: new Date()
            }
            serviceRes.serviceName = service.serviceName;
            return serviceRes;
        }

    });
}

function checkMongo(service) {
    return new BPromise(function (resolve) {
        var resp = {
            timestamp: new Date(),
            serviceName: service.serviceName
        };

        var collection = service.dbConnection.collection('system.js');
        collection.findOne({}, function (error) {
            if (error) {
                resp.status = UNAVAILABLE;
            } else {
                resp.status = AVAILABLE;
            }
            resolve(resp);
        });
    });
}

/**
 *
 * @param configuration The service dependency configuration. Refer readme for sample structure.
 * @param intervalInMin Time interval to poll dependent services. Defaults to 5 minutes.
 * @param logger The logger used by the client. Must support info and error methods. Defaults to console.log.
 * @returns {Function} The handler that can be mounted at a suitable route.
 */
module.exports = function checkHealth(configuration, intervalInMin, logger) {
    var services = configuration || [];
    var interval = intervalInMin || 5;
    var healthStatus = {
        status: 'AVAILABLE',
        timestamp: new Date(),
        message: '',
        services: []
    };

    setInterval(function () {
        BPromise.map(services, function (service) {
            switch (service.type) {
                case 'REST':
                    return checkRestService(service);
                case 'MONGO':
                    return checkMongo(service);
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
                return result.status === UNAVAILABLE;
            });
            healthStatus.status = unavailable ? UNAVAILABLE : AVAILABLE;

            if (logger) {
                logger.info('Overall Component Health Status : ' + healthStatus.status);
            } else {
                console.log('Overall Component Health Status : ' + healthStatus.status);
            }
        }).catch(function (err) {
            if (logger) {
                logger.error(err);
            } else {
                console.error(err);
            }
        });
    }, interval * 60 * 1000);

    return function (req, res) {
        if (healthStatus.status === 'AVAILABLE') {
            healthStatus.message = 'All the components are up and running - Uptime : ' + process.uptime() + ' sec';
            res.status(200).json(healthStatus);
        } else {
            healthStatus.message = 'One or more component(s) not available';
            res.status(503).json(healthStatus);
        }

    };
};



