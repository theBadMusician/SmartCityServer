//>>>- Modules ---------------------------------------<::>>>
var express = require('express');
var socket = require('socket.io');
var secrets = require('./SECRETS.js');
var bodyParser = require('body-parser');
var events = require('events');

var uuid = require('node-uuid');
var fs = require('fs');

//var JSONStream = require('JSONStream');
//var es = require('event-stream');

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var nodeCleanup = require('node-cleanup');

var si = require('systeminformation');
//>>>-------------------------------------------------<::>>>

//>>>- JSON ------------------------------------------<::>>>
var fileName = './measuredData.json';
var measuredData = require('./measuredData.json');

// var getStream = function () {
//     var jsonData = 'measuredData.json';
//     var stream = fs.createReadStream(jsonData, { encoding: 'utf8' });
//     var parser = JSONStream.parse('*.*.*');
//     return stream.pipe(parser);
// };

// getStream()
//     .pipe(es.mapSync(function (data) {
//         console.log(data);
//         console.count();
//         console.log(">>-<<>>");
//     }));
//>>>-------------------------------------------------<::>>>

//>>>- variables/objects -----------------------------<::>>>
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var jsonParser = bodyParser.json();
var rxEmitter = new events.EventEmitter();
var txEmitter = new events.EventEmitter();

let visitCounter = require('./visitCounter.json').visitCounter;
nodeCleanup(function (exitCode, signal) {
    var count = {visitCounter: visitCounter};
    fs.writeFileSync("visitCounter.json", JSON.stringify(count));
});


var randomID = '/'+uuid.v4();
/*
setInterval(() => {
    randomID = '/'+uuid.v4();
    console.log(randomID);
}, 10000);
*/

// Read/Write JSON measurements
var tempData;
var sensorObjects = {};
//>>>-------------------------------------------------<::>>>

//>>>- Check database at startup ---------------------<::>>>
Object.getOwnPropertyNames(measuredData).forEach(sensor => {
    console.log(sensor, " has ", measuredData[sensor].length, " number of records.");
    if (measuredData[sensor].length < 50) sensorObjects[sensor] = measuredData[sensor].slice(-measuredData[sensor].length);
    else sensorObjects[sensor] = measuredData[sensor].slice(-50);
});
//>>>-------------------------------------------------<::>>>

//>>>- Console commands ------------------------------<::>>>
rl.on('line', function (text) {
    switch(text.trim()) {
        case 'quit':
            process.exit();

        case 'del db --entries': 
            Object.getOwnPropertyNames(measuredData).forEach(sensor => {
                console.log(sensor, " has ", measuredData[sensor].length, " number of records.");
            })

            rl.question("Sensor: ", function (sensor) {
                rl.question("Number of entries: ", function (entries) {
                    // console.log('  sensor: ' + sensor);
                    // console.log('  number of entries: ' + entries);

                    if (entries === 'all') delete measuredData[sensor];
                    else if (entries === 'none') return;
                    else if (entries < 0) measuredData[sensor].splice(entries);
                    else measuredData[sensor].splice(0, entries);

                    fs.writeFile(fileName, JSON.stringify(measuredData, null, 2), function writeJSON(err) {
                        if (err) return console.log(err);
                    });

                    Object.getOwnPropertyNames(measuredData).forEach(sensor => {
                        console.log(sensor, " has ", measuredData[sensor].length, " number of records.");
                    });
                });
            });
            console.log("\n");
            break;

        case 'show db --sensors':
            Object.getOwnPropertyNames(measuredData).forEach(sensor => {
                console.log(sensor, " has ", measuredData[sensor].length, " entries.");
            });
            console.log("\n");
            break;

        case 'show db --entries':
            var entries = 0;
            Object.getOwnPropertyNames(measuredData).forEach(sensor => {
                entries += (Object.keys(measuredData[sensor][0]).length) * measuredData[sensor].length;
            });
            console.log("Database has a total of ", entries, "entries.")
            console.log("\n");
            break;

        case 'show memuse':
            console.log('The script uses approximately ', (process.memoryUsage().heapUsed / 1024 / 1024),' MB of RAM.\n');
            break;

        case 'show mem --total':
            si.mem().then(data => console.log("Total RAM: ", data.total / 1024 / 1024, "MB"));
            break;

        case 'show mem --free':
            si.mem().then(data => console.log("Free RAM: ", data.free / 1024 / 1024, "MB"));
            break;
            
        case 'show mem --used':
            si.mem().then(data => console.log("Total used RAM: ", data.used / 1024 / 1024, "MB"));
            break;

        case 'show cpu --load':
            si.currentLoad().then(data => console.log("Current load on CPU: ", data.currentload, "%"));
            break;

	    case 'show cpu --temp':
            si.cpuTemperature().then(data => {
                if (data.main == -1) {
                    console.log("ERROR! Cannot read CPU temperature.");
                    return;
                }
                else console.log("CPU core temeperature: ", data.main, "°C")});
            break;
            
        case 'show cpu --speed':
            si.cpuCurrentspeed().then(data => console.log("Server avg. CPU core speed: ", data.avg, "GHz across ", data.cores.length, "cores"));
            break;
    };

});
//>>>-------------------------------------------------<::>>>

//>>>- Express app setup -----------------------------<::>>>
const port = 80;

var app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use('/assets', express.static('assets'));

// Start listening
var server = app.listen(port, function(){
    console.log('%s Listening for requests on port %d...', Date().toString(), port);
});
//>>>-------------------------------------------------<::>>>

//>>>- Socket setup & pass server --------------------<::>>>
var io = socket(server);

io.on('connection', (socket) => {
    // socket.removeAllListeners();

    console.log(Date().toString(), 'Made a socket connection. Socket ID:', socket.id);
    io.sockets.emit('visitCounter', visitCounter);
    io.sockets.emit('updateCharts', sensorObjects);
    io.sockets.emit('updateCompResources', compResources);
  

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

// Handle monitor events
txEmitter.on('dataWritten', function () {
    io.emit('updateCharts', sensorObjects);
});

si.cpuTemperature().then(data => compResources.CPUtemp = data.main);
si.currentLoad().then(data => compResources.CPUload = data.currentload);
si.mem().then(data => compResources.memuse = data.used / 1024 / 1024);
io.emit('updateCompResources', compResources);
var compResources = {};
setInterval(() => {
    si.cpuTemperature().then(data => compResources.CPUtemp = data.main);
    si.currentLoad().then(data => compResources.CPUload = data.currentload);
    si.mem().then(data => compResources.memuse = data.used / 1024 / 1024);
    io.emit('updateCompResources', compResources);
}, 60000);
//>>>-------------------------------------------------<::>>>

//>>>- HTTP reqs -------------------------------------<::>>>
app.get('/', (req, res) => {
    visitCounter += 1;
    console.log(Date().toString(), "Requested URL: ", req.url, "Request IP: ", req.ip, "Total requests: ", visitCounter);
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
        tempData = chunk;
    });
    req.on('end', () => {
        tempData = JSON.parse(tempData);
        Object.getOwnPropertyNames(tempData).forEach(sensor => {
            tempData[sensor]["UNIX"] = Date.now();
        });
        console.log(Date().toString(), "Received data: ", tempData);
        
        rxEmitter.emit('DBupdate');
    });
    res.sendStatus(200);
    
});

app.get("/get-data", (req, res) => {
    console.log(Date().toString(), "Requested URL: ", req.url);
    res.json(measuredData);;
});
//>>>-------------------------------------------------<::>>>

//>>>- Handle data intake and process it to database -<::>>>
rxEmitter.on('DBupdate', function() {
    Object.getOwnPropertyNames(tempData).forEach(sensor => {

        if (measuredData.hasOwnProperty(sensor)) {
            measuredData[sensor].push(tempData[sensor]);
            if (measuredData[sensor].length > 15000) measuredData[sensor].splice(0, 5000);
        }
        else {
            measuredData[sensor] = {};
            measuredData[sensor] = [tempData[sensor]];
        }

        // In case of receiving new sensor data
        if (!sensorObjects.hasOwnProperty(sensor)) {
            sensorObjects[sensor] = {};
            sensorObjects[sensor] = [tempData[sensor]];
        }
            // If DB doesnt yet have 50 measurements
        else if (measuredData[sensor].length <= 50) {
            sensorObjects[sensor] = {};
            sensorObjects[sensor] = measuredData[sensor].slice();
            //sensorObjects[sensor].push(measuredData[sensor][measuredData[sensor].length - 1]);
        }// Normal behaviour
        else {
            sensorObjects[sensor].push(measuredData[sensor].slice(-1)[0]);
            sensorObjects[sensor].shift();
            //DBshiftpushToArray(measuredData[sensor], sensorObjects[sensor], 1);
        }
    });


    fs.writeFile(fileName, JSON.stringify(measuredData, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
        
        
        txEmitter.emit('dataWritten');
    });
});
//>>>-------------------------------------------------<::>>>
