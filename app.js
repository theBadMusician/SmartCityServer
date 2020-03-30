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
var myEmitter = new events.EventEmitter();


let visitCounter = 0;

var randomID = '/'+uuid.v4();
/*
setInterval(() => {
    randomID = '/'+uuid.v4();
    console.log(randomID);
}, 10000);
*/

// Read/Write JSON measurements
var tempData;
var writeData;
var dataList0 = [];

function UNIXtoHHMMSS(UnixTimeStampInMillis) {
    var date = new Date(UnixTimeStampInMillis);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    
    // Will display time in 10:30:23 format
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}

if (measuredData.BMP280.thermometer.data.length < 50) return;
for (var i = 50; i > 0; i--){
    var timeData = [UNIXtoHHMMSS(measuredData.BMP280.thermometer.data[measuredData.BMP280.thermometer.data.length - i][0]),
                measuredData.BMP280.thermometer.data[measuredData.BMP280.thermometer.data.length - i][1]];
    dataList0.push(timeData);
}


myEmitter.on('tempUpdate', function() {
    measuredData.BMP280.thermometer.data.push(writeData);
    fs.writeFile(fileName, JSON.stringify(measuredData, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
        
        var timeData = [UNIXtoHHMMSS(measuredData.BMP280.thermometer.data[measuredData.BMP280.thermometer.data.length - 1][0]),
        measuredData.BMP280.thermometer.data[measuredData.BMP280.thermometer.data.length - 1][1]];

        dataList0.shift();
        dataList0.push(timeData);
        
        myEmitter.emit('dataWritten');
    });
})



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
io.on('connection', (socket) => {

    console.log(Date().toString(), 'Made a socket connection. Socket ID:', socket.id);
    io.sockets.emit('visitCounter', visitCounter);
    io.sockets.emit('update', dataList0);

    // Handle chat events
    socket.on('chat', function(data){
        console.log(Date().toString(), data);
        io.sockets.emit('chat', data);
    });

    socket.on('typing', function(data){
      socket.broadcast.emit('typing', data);
    })

    // Handle monitor events
    myEmitter.on('dataWritten',function() {
        io.sockets.emit('update', dataList0);
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
      writeData = [Date.now(), tempData.temperature, tempData.pressure, tempData.altitude];
      console.log(Date().toString(), "Received data: ", tempData);
      //sensor = tempData.sensor;
    });
    req.on('end', () => {
      console.log('*END OF DATA*');
      myEmitter.emit('tempUpdate');
    })
    res.sendStatus(200);
    
});

app.get("/get-data", (req, res) => {
    console.log(Date().toString(), "Requested URL: ", req.url);
    res.json(measuredData);;
});
