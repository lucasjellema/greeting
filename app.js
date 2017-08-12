var http = require('http');
var Client = require("node-rest-client").Client;

var version = '1.2.3';

// Read Environment Parameters
var port = Number(process.env.PORT || 8080);
var greeting = process.env.GREETING || 'Hello World!';

var requestCounter = 0;

var server = http.createServer(function (request, response) {
  getRequestCounter( function (value) {
     requestCounter = (value?value+1:requestCounter+1);
     // put new value in cache  - but do not wait for a response          
     console.log("write value to cache "+requestCounter);
     writeRequestCounter(requestCounter);         
     response.writeHead(200, {"Content-Type": "text/plain"});
     response.end( "Version "+version+" says an unequivocal: "+greeting 
                 + ". Request counter: "+ requestCounter +". \n"
                 );
  })
});

server.listen(port);

// functionality for cache interaction
// for interaction with cache
var CCSHOST = process.env.CACHING_INTERNAL_CACHE_URL; 
var baseCCSURL = 'http://' + CCSHOST + ':8080/ccs';
var cacheName = "greetingCache";
var client = new Client(); 


var keyString = "requestCount";

function getRequestCounter(callback)  {
    client.get(baseCCSURL.concat('/').concat(cacheName).concat('/').concat(keyString),
        function(data, rawResponse){
            var value;
            // If nothing there, return not found
            if(rawResponse.statusCode == 404){
              console.log("nothing found in the cache");
              value = null;
            }
            else{
              // Note: data is a Buffer object.
              console.log("value found in the cache "+data.toString());
              value = JSON.parse(data.toString()).requestCounter;
            }          
            callback(value);
        }
     );
};//getRequestCounter

function writeRequestCounter(requestCounter) {
var args = {
        data: { "requestCounter": requestCounter},
        headers: { "Content-Type" : "application/json" }
    };
    // put is only for initial creation of cache value with key keystring; for updates, use POST and headers  :
    // { "Content-Type" : "application/octet-stream",
    //               "X-Method" : "replace"}//Important! specify the x-Method for replacing the value
      client.put(baseCCSURL.concat('/').concat(cacheName).concat('/').concat(keyString),
        args,
        function (data, rawResponse) {   
            // Proper response is 204, no content.
            if(rawResponse.statusCode == 204){
              console.log("Successfully put in cache "+JSON.stringify(data))
            }
            else{
              console.error("Error in PUT "+rawResponse);
              console.error('writeRequestCounter returned error '.concat(rawResponse.statusCode.toString()));
            } 
        }
      );
}// writeRequestCounter