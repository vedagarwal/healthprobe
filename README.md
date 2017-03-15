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

//time interval between healthprobe in mins
var interval = 2;

app.use('/healthcheck', healthprobe(configuration,interval));
```

## Paramaters
```sh
healthprobe(configuration,interval,logger);
```
| Paramater | Required | Description |
| --------- | -------- | ----------- |
| configuration | Yes | Array containing various services for which health has to be verified |
| interval | Yes | Time interval between health probes in mins. The scheduler would make healthcheck on this interval |
| logger | No | Supply your custom logger for logging the health check probes to downstream services |


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
    connection: mongoose.connection,
    testCollectionName: 'testcollection'
}
```

 | Key | Description |
 | --- | ----------- |
 | serviceName | Name of the service, this would be retured as part of the response also |
 | type | REST/MONGO |
 | healthCheckURI | URL for getting the health check status of downstream services; to be used only for REST type |
 | connection | pass mongoose.connection object for getting health status of Mongo Connection |
 | testCollectionName | Mongo collection name for testing mongo connection. This could be any collection which has atleast one item/document |

 ### Sample Response
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
 ```