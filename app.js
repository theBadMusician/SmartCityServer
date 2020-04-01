var express = require('express');
var socket = require('socket.io');
var secrets = require('./SECRETS.js');
var bodyParser = require('body-parser');
var events = require('events');
var uuid = require('node-uuid');
var fs = require('fs');

var fileName = './measuredData.json';
var measuredData = require('./measuredData.json');

//Initializing variables/objects
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var jsonParser = bodyParser.json();
var rxEmitter = new events.EventEmitter();
var txEmitter = new events.EventEmitter();

let visitCounter = 0;

var randomID = '/'+uuid.v4();
/*
setInterval(() => {
    randomID = '/'+uuid.v4();
    console.log(randomID);
}, 10000);
*/

function DBpushToArray(device, array, numItems) {
    if (numItems > device.length) throw RangeError("'numItems' is out of bounds for the 'array'.");

    for (var i = numItems; i > 0; i--) array.push(device[device.length - i]);
}

function DBshiftpushToArray(device, array, numItems) {
    if (numItems > device.length) throw RangeError("'numItems' is out of bounds for the 'array'.");

    for (var i = numItems; i > 0; i--) {
        array.shift();
        array.push(device[device.length - i]);
    }
}

// Read/Write JSON measurements
var tempData;
var sensorObjects = {BMP280: []};
var sensorName;
sensorObjects.BMP280 = measuredData.BMP280.slice(-50);
// DBpushToArray(measuredData.BMP280, sensorObjects.BMP280, 50);

// App setup
const port = 80;

var app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());
//app.use(bodyParser.raw());

// Static files
app.use('/assets', express.static('assets'));

// Start listening
var server = app.listen(port, function(){
    console.log('%s Listening for requests on port %d...', Date().toString(), port);
});


// Socket setup & pass server
var io = socket(server);

// Handle monitor events
txEmitter.on('dataWritten', function () {
    console.log("dataWritten received!", sensorName);

    io.emit('update', sensorObjects);
});

io.on('connection', (socket) => {
    // socket.removeAllListeners();

    console.log(Date().toString(), 'Made a socket connection. Socket ID:', socket.id);
    io.sockets.emit('visitCounter', visitCounter);
    io.sockets.emit('update', sensorObjects);
  

    // Handle chat events
    socket.on('chat', function(data){
        console.log(Date().toString(), data);
        io.sockets.emit('chat', data);
    });

    socket.on('typing', function(data){
      socket.broadcast.emit('typing', data);
    });

    // Handle login events
    socket.on('ESP32login', function(data){
        console.log("Login submitted.", randomID)
        if (data.userid == secrets.ESP32_userid && data.password == secrets.ESP32_pwd) {
            socket.emit('correct', '/redirect');
        } else {
            socket.emit('incorrect');
        }
        
    });
});


//HTTP reqs
app.get('/', (req, res) => {
    visitCounter += 1;
    console.log(Date().toString(), "Requested URL: ", req.url, "Request number ", visitCounter);
    res.render('index');
});

app.get('/chat', (req, res) => {
    console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('chat');
});

app.get('/monitor', (req, res) => {
    console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('monitor');
});

app.get('/esp-login', (req, res) => {
    console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('esp_login');
});

app.get('/redirect', (req, res) => {
    console.log("REDIRECT", randomID);
    res.redirect(randomID);
});

app.get(randomID, (req, res) => {
    console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('esp_upload');
});

app.post('/post-test', function(req, res){
    req.setEncoding('utf8');
    req.on('data', chunk => {
      tempData = JSON.parse(chunk);
      tempData["UNIX"]=Date.now();
      console.log(Date().toString(), "Received data: ", tempData);
      //sensor = tempData.sensor;
    });
    req.on('end', () => {
      console.log('*END OF DATA*');
      rxEmitter.emit('DBupdate');
    });
    res.sendStatus(200);
    
});

app.get("/get-data", (req, res) => {
    console.log(Date().toString(), "Requested URL: ", req.url);
    res.json(measuredData);;
});


rxEmitter.on('DBupdate', function() {
    sensorName = tempData.sensor;
    delete tempData.sensor;
    measuredData[sensorName].push(tempData);
    
    fs.writeFile(fileName, JSON.stringify(measuredData, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
        
        DBshiftpushToArray(measuredData[sensorName], sensorObjects[sensorName], 1);
        txEmitter.emit('dataWritten');
    });
});