var _ = require('lodash');
var rp = require('request-promise');
var BPromise = require('bluebird');
var schedule = require('node-schedule');

module.exports = function checkHealth(configuration, intervalInMin, logger) {
    var services = configuration || [];

    var healthStatus = {
        status: 'AVAILABLE',
        timestamp: new Date(),
        message: '',
        services: []
    };

    var rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(0, 59, intervalInMin);

    var job = schedule.scheduleJob(rule, function () {
        BPromise.map(services, function (service) {
                if (service.type === 'REST') {
                    // Set Request Options
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
                        healthStatus.status = 'UNAVAILABLE';
                        err.response.body.serviceName = service.serviceName;
                        return err.response.body;
                    });
                } else if (service.type === 'MONGO') {
                    return new BPromise(function (resolve) {
                        var resp = {
                            timestamp: new Date(),
                            serviceName: service.serviceName
                        };

                        service.connection.db.collection(service.testCollectionName, function (err, collection) {
                            collection.findOne({}, function (error) {
                                if (error) {
                                    resp.status = 'UNAVAILABLE';
                                } else {
                                    resp.status = 'AVAILABLE';
                                }
                                resolve(resp);
                            });
                        });
                    });
                }
                throw new Error('Service Type Not Supported');
            }
        ).then(function (results) {
            healthStatus.services = [];
            _.map(results, function (result) {
                healthStatus.services.push({
                    service: result.serviceName,
                    response: {
                        status: result.status,
                        timestamp: result.timestamp
                    }
                });
            });
        }).catch(function (err) {
            if (logger) {
                logger.error(err);
            } else {
                console.error(err);
            }
        });
    });

    job.on('run', function () {
        if (logger) {
            logger.info('Overall Component Health Status : ' + healthStatus.status);
        } else {
            console.log('Overall Component Health Status : ' + healthStatus.status);
        }
    });


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


