var _ = require('lodash');
var rp = require('request-promise');
var BPromise = require('bluebird');
var schedule = require('node-schedule');


module.exports = function (services, intervalInMin) {
    services = services || {};

    var healthStatus = {
        status: 'AVAILABLE',
        timestamp: new Date(),
        message: '',
        services: []
    };

    var rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(0, 59, intervalInMin);

    schedule.scheduleJob(rule, function () {

        console.log("Probing HealthCheck For Services");

        BPromise.map(services, function (service) {

                if (service.type === 'REST') {
                    //Set Request Options
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
                    })
                }
                else if (service.type === 'MONGO') {

                    return new BPromise(function (resolve) {

                        var resp = {
                            timestamp: new Date(),
                            serviceName: service.serviceName
                        }

                        service.connection.db.collection(service.testCollectionName, function (err, collection) {
                            collection.findOne({}, function (err, data) {
                                if (data) {
                                    resp.status = 'AVAILABLE'
                                } else {
                                    resp.status = 'UNAVAILABLE'
                                }
                                resolve(resp);
                            });
                        });


                    });

                } else {
                    throw new Error("Type Not Supported");
                }

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
            })
        }).catch(function (err) {
            console.log(err);
        });

    });

    return function (req, res, next) {

        if (healthStatus.status == "AVAILABLE") {
            healthStatus.message = "All the components are up and running - Uptime : " + process.uptime() + " sec";
            res.status(200).json(healthStatus);
        } else {
            healthStatus.message = "One or more component(s) not available";
            res.status(503).json(healthStatus);
        }

    }

}





