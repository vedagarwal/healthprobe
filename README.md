# Healthprobe - An Node Express Module For Tracking Your Application Health

Healthprobe is node component built to test and return the health status of your node app. This component verifies the health of downstream components like REST Services, MongoDB connections and returns an aggregate health status.

## Basic Requirements
The downstream REST services should return the health status in the given format for this module to work.

-- For Service Up & Running
```sh
HTTP STATUS CODE : 200 OK
{
    "status" : "AVAILABLE",
    "timestamp" : "Wed Mar 15 08:44:37 GMT 2017"
}
```

-- For Service Down
```sh
HTTP STATUS CODE : 503 Service Unavailable
{
    "status" : "UNAVAILABLE",
    "timestamp" : "Wed Mar 15 08:44:37 GMT 2017"
}
```

# Usage

```sh
var healthprobe = require('healthprobe');
var app = express();

var configuration = [
{
    serviceName: 'Rest Service 1',
    type: 'REST',
    healthCheckURI: 'https://xyz.com/service/healthcheck',
    auth: 'Basic abcdef'
},
{
    serviceName: 'Rest Service 2',
    type: 'REST',
    healthCheckURI: 'https://def.com/service/healthcheck',
    auth: 'Basic abcdef'
}
];

//time interval between healthprobe in seconds
var interval = 10;

app.use('/healthcheck', healthprobe(configuration, interval));
```

## Parameters
```sh
healthprobe(configuration, interval, logger);
```
| Parameter | Required | Description |
| --------- | -------- | ----------- |
| configuration | Yes | Array containing various services for which health has to be verified. |
| interval | No | Time interval between health probes in seconds. The scheduler would make healthcheck on this interval. Defaults to 30 seconds. |
| logger | No | Supply your custom logger for logging the health check probes to downstream services. Defaults to console.log. |


## Configuration

-- REST
```sh
{
    serviceName: 'Rest Service 1',
    type: 'REST',
    healthCheckURI: 'https://xyz.com/service/healthcheck',
    auth: 'Basic abcdef'
}
```
-- MONGODB (Mongoose)
```sh
{
    serviceName: 'MongoDB',
    type: 'MONGO',
    dbConnection: mongoose.connection.db
}
```
-- MONGODB (Native)
```sh
{
    serviceName: 'MongoDB',
    type: 'MONGO',
    dbConnection: db
}
```

| Key | Description |
| --- | ----------- |
| serviceName | Name of the service, this would be retured as part of the response also |
| type | REST or MONGO |
| healthCheckURI | URL for getting the health check status of downstream services. To be used only for REST type |
| dbConnection | The db object for getting health status of Mongo Connection. If using mongoose, pass mongoose.connection.db . To be used only for MONGO type |

## Sample Response

```sh
HTTP STATUS CODE : 200 OK
{
    "status": "AVAILABLE",
    "timestamp": "2017-03-15T09:22:13.526Z",
    "message": "All the components are up and running - Uptime : 57 sec",
    "services": [
    {
        "service": "Rest Service 1",
        "response": {
        "status": "AVAILABLE",
        "timestamp": "Wed Mar 15 09:22:58 GMT 2017"
        }
    },
    {
    "service": "Rest Service 2",
    "response": {
    "status": "AVAILABLE",
    "timestamp": "Wed Mar 15 09:22:58 GMT 2017"
        }
    },
    {
    "service": "MongoDB",
    "response": {
    "status": "AVAILABLE",
    "timestamp": "2017-03-15T09:23:00.531Z"
        }
    }
    ]
}
````

## License

The MIT License (MIT)

Copyright (c) 2017 Ved Agarwal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
