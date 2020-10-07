//>>>- Modules ---------------------------------------<::>>>
const express = require('express');                 // Eases the use of Node.js
const socket = require('socket.io');                // Websocket event handling
const bodyParser = require('body-parser');          // For parsing JSON and data structures
const events = require('events');                   // Async event handling

const uuid = require('node-uuid');                  // Unique IDs for login form 
const fs = require('fs');                           // File system handling

const readline = require("readline");               // Command line handling - uses in terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const nodeCleanup = require('node-cleanup');        // Exit event handling  

const gitlog = require('gitlog');                   // Git logs access
const options = {
    repo: __dirname,
    number: 100,
    fields: ["hash", "abbrevHash", "subject", "authorDate", "authorName"],
    execOptions: { maxBuffer: 1000 * 1024 }
};

const geoip = require('geoip-lite');                // IP address geoloacation

const secrets = require('./SECRETS.js');            // API keys, IP addresses, dir trees

const si = require('systeminformation');            // System information
const os = require('os');                           // OS information
const networkInterfaces = os.networkInterfaces();   // Network interface information
if (networkInterfaces['wlan0'] != null) console.log(networkInterfaces['wlan0'][0]);
else if (networkInterfaces['WiFi'] != null) console.log(networkInterfaces['WiFi'][1]);
else if (networkInterfaces['Wi-Fi'] != null) console.log(networkInterfaces['Wi-Fi'][1]);
else console.log(networkInterfaces);

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: secrets.gmail_id,
    pass: secrets.gmail_pwd
  }
});
var mailOptions = {
    from: secrets.gmail_id,
    to: secrets.recv_email_id,
    subject: 'placeholder',
    text: 'placeholder'
};
var prevCPUtemp = 100;
setInterval(() => {
    let sendEmail = false
    if (compResources.CPUtemp > 60.0) {
        mailOptions.subject = "CPU temperature is over limit!"
        mailOptions.text = "CPU temperature is at " + String(compResources.CPUtemp) + ". Turn off the RasPi or lessen the load."
        if (compResources.CPUtemp > prevCPUtemp) {
	    prevCPUtemp = 100;
	    sendEmail = true
	}
	if (compResources.CPUtemp < prevCPUtemp) {
	    prevCPUtemp = compResources.CPUtemp;
	}
    }
    if (compResources.CPUload > 90.0) {
        mailOptions.subject = "CPU load is over limit!"
        mailOptions.text = "CPU load is at " + String(compResources.CPUload) + ". Turn off the RasPi or lessen the load."
        sendEmail = true
    }
    if (compResources.memuse > 890) {
        mailOptions.subject = "RAM usage is over limit!"
        mailOptions.text = "RAM usage is at " + String(compResources.memuse) + ". Turn off the RasPi or enable garbage collection."
        sendEmail = true
    }
    if (sendEmail == true) {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log(Date().toString() + ' Email sent to: ' + secrets.recv_email_id + ' Server Response: ' + info.response);
            }
        sendEmail = false
        });
    }
}, 6000);



//>>>-------------------------------------------------<::>>>

//>>>- JSON files ------------------------------------<::>>>
// Get database files for reading and writing
var fileName = './measuredData.json';               
var measuredData = require('./measuredData.json'); 
var visitCounter = require('./visitCounter.json').visitCounter;
var visitCities = require('./visitCities.json');
var maxValueThresholds = require('./thresholds.json');

//>>>-------------------------------------------------<::>>>

//>>>- GP variables/objects --------------------------<::>>>
// Data parsers for requests
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var jsonParser = bodyParser.json();

// Emitter objects for event handling
var rxEmitter = new events.EventEmitter();
var txEmitter = new events.EventEmitter();

// ESP32 alarm variables
var maxValues = {};
var num_of_thresholds = 2;
var valAlarm = false;

// Save database files before killing server
nodeCleanup(function(exitCode, signal) {
    var count = { visitCounter: visitCounter };
    fs.writeFileSync("visitCounter.json", JSON.stringify(count));
    fs.writeFileSync("visitCities.json", JSON.stringify(visitCities));
    fs.writeFileSync("thresholds.json", JSON.stringify(maxValueThresholds));
});

// Set random route ID for ESP32 login form
var randomID = '/' + uuid.v4();
/*
setInterval(() => {
    randomID = '/'+uuid.v4();
    console.log(randomID);
}, 10000);
*/

// Variables for intermittent data storage before handling it
var tempData;               // Temporary container for receiving sensor data from ESP32
var sensorObjects = {};     // Processed sensor data container for serving measurements to website
var lastSaveUNIX = {};      // UNIX time stamp from last received sensor data 

// Git commit logs for serving commit history to website
var gitcommits;
gitlog.default(options, function(error, commits) {
    gitcommits = commits;
});
//>>>-------------------------------------------------<::>>>

//>>>- Check database at startup ---------------------<::>>>
// Processes sensor data from the database on startup
Object.getOwnPropertyNames(measuredData).forEach(sensor => {
    console.log(sensor, " has ", measuredData[sensor].length, " number of records.");
    
    // Takes last 100 measurements from each sensor if available and stores it in a variable
    if (measuredData[sensor].length < 100) sensorObjects[sensor] = measuredData[sensor].slice(-measuredData[sensor].length);
    else sensorObjects[sensor] = measuredData[sensor].slice(-100);
});
checkMaxValue();
//>>>-------------------------------------------------<::>>>

//>>>- Console commands ------------------------------<::>>>
// For disabling certain console logs
var requestOutput = true,
    alarmOutput = false,
    measurementOutput = false;

// Imitates a terminal for making certain commands during server runtime
rl.on('line', function(text) {
    switch (text.trim()) {

        // Kills server process
        case 'quit':
            process.exit();

        case 'q':
            process.exit();

        // Deletes chosen database entries
        case 'del db --entries':
            Object.getOwnPropertyNames(measuredData).forEach(sensor => {
                console.log(sensor, " has ", measuredData[sensor].length, " number of records.");
            })

            rl.question("Sensor: ", function(sensor) {
                rl.question("Number of entries: ", function(entries) {
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

        // Shows number of entries stored in the database for each sensor
        case 'show db --sensors':
            Object.getOwnPropertyNames(measuredData).forEach(sensor => {
                console.log(sensor, " has ", measuredData[sensor].length, " entries.");
            });
            console.log("\n");
            break;
        
        // Shows number of total sensor entries stored in the database
        case 'show db --entries':
            var entries = 0;
            Object.getOwnPropertyNames(measuredData).forEach(sensor => {
                entries += (Object.keys(measuredData[sensor][0]).length) * measuredData[sensor].length;
            });
            console.log("Database has a total of ", entries, "entries.")
            console.log("\n");
            break;

        // Shows amount of heap being used by the server process
        case 'show memuse':
            console.log('The script uses approximately ', (process.memoryUsage().heapUsed / 1024 / 1024), ' MB of the', process.memoryUsage().heapTotal / 1024 / 1024, 'heap.\n');
            break;

        // Shows total amount of RAM available on the device
        case 'show mem --total':
            si.mem().then(data => console.log("Total RAM: ", data.total / 1024 / 1024, "MB"));
            break;

        // Shows total amount of free RAM available on the device
        case 'show mem --free':
            si.mem().then(data => console.log("Free RAM: ", data.free / 1024 / 1024, "MB"));
            break;

        // Shows total amount of RAM used on the device
        case 'show mem --used':
            si.mem().then(data => console.log("Total used RAM: ", data.used / 1024 / 1024, "MB"));
            break;

        // Shows total percentage of CPU being used on the device  
        case 'show cpu --load':
            si.currentLoad().then(data => console.log("Current load on CPU: ", data.currentload, "%"));
            break;

        // Shows average CPU core temperature of the device
        case 'show cpu --temp':
            si.cpuTemperature().then(data => {
                if (data.main == -1) {
                    console.log("ERROR! Cannot read CPU temperature.");
                    return;
                } else console.log("CPU core temeperature: ", data.main, "°C")
                
            });
            break;

        // Shows the average CPU core speed and number of cores
        case 'show cpu --speed':
            si.cpuCurrentspeed().then(data => console.log("Server avg. CPU core speed: ", data.avg, "GHz across ", data.cores.length, "cores"));
            break;

        // Shows server uptime
        case 'show server --uptime':
            console.log(secs2HHMMSS(process.uptime()));
            break;

        // Shows max value thresholds for use by the ESP32 alarm
        case 'show thres --max':
            console.log("Currently set maximum thresholds: ")
            for (let [key, value] of Object.entries(maxValueThresholds)) {
                console.log(key, ": ", value);
            }
            break;

        // Shows highest recorded values for each stored measurement by the ESP32 alarm
        case 'show val --max':
            console.log("Currently set maximum thresholds: ")
            for (let [key, value] of Object.entries(maxValues)) {
                console.log(key, ": ", value);
            }
            break;

        // Toggles requests output to console
        case 'toggle output --req':
            requestOutput = !requestOutput;
            alarmOutput = requestOutput;
            measurementOutput = requestOutput;
            if (requestOutput) console.log("Server request output is ON!");
            else console.log("Server request output is OFF!");
            break;

        // Toggles alarm output to console
        case 'toggle output --alarm':
            alarmOutput = !alarmOutput;
            if (alarmOutput) console.log("Server alarm request output is ON!");
            else console.log("Server alarm request output is OFF!");
            break;

        // Toggles received data output to console
        case 'toggle output --data':
            measurementOutput = !measurementOutput;
            if (measurementOutput) console.log("Server data request output is ON!");
            else console.log("Server data request output is OFF!");
            break;

        // Changes max value thresholds for use by the ESP32 alarm
        case 'change thres --max':
            console.log("Currently set maximum thresholds: ")
            for (let [key, value] of Object.entries(maxValueThresholds)) {
                console.log(key, ": ", value);
            }
            console.log("\n");

            rl.question("Measurement: ", function(measurement) {
                rl.question("Threshold: ", function(threshold) {
                    maxValueThresholds[measurement] = threshold;

                    console.log("\nNew maximum thresholds: ")
                    for (let [key, value] of Object.entries(maxValueThresholds)) {
                        console.log(key, ": ", value);
                    }

                    checkMaxValue();
                });
            });
            break;

    };

});
//>>>-------------------------------------------------<::>>>

//>>>- Express app setup -----------------------------<::>>>
// General Node.js server setup with help of Express module
const port = 80;

var app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use('/assets', express.static('assets'));

// Start listening to reqs
var server = app.listen(port, function() {
    console.log('%s Listening for requests on port %d...', Date().toString(), port);
});
//>>>-------------------------------------------------<::>>>

//>>>- Socket setup & pass server --------------------<::>>>
var io = socket(server);

// Root Socket.io namespace mostly for use with ESP32s
io.on('connection', (socket) => {
    // Update Zumo32U4 states
    socket.emit('lineFollowerBtnUpdate', lineFollowerBtnFlag);
    socket.emit('RCControlBtnUpdate', RCControlBtnFlag);
    socket.emit('directControlBtnUpdate', directControlBtnFlag);

    // Handle chat events
    socket.on('chat', function(data) {
        console.log(Date().toString(), data);
        io.sockets.emit('chat', data);
    });

    socket.on('typing', function(data) {
        socket.broadcast.emit('typing', data);
    });

    // Handle login events
    socket.on('ESP32login', function(data) {
        console.log("Login submitted.", randomID)
        if (data.userid == secrets.ESP32_userid && data.password == secrets.ESP32_pwd) {
            socket.emit('correct', '/redirect');
        } else {
            socket.emit('incorrect');
        }
    });

    // Zumo Direct Control events from the website
    socket.on('zumoDirectControl', function(data) {
        if (zumoDirectControl) {
            let directControlState = 0;
            console.log(data);

            // Processes the received JS object into state machine interface for easier use with ESP32
            if ((!data.UP && !data.DOWN && !data.LEFT && !data.RIGHT) || (data.UP && data.DOWN && !data.LEFT && !data.RIGHT)) directControlState = 0;
            else if (data.UP && !data.DOWN && !data.LEFT && !data.RIGHT) directControlState = 1;
            else if (!data.UP && data.DOWN && !data.LEFT && !data.RIGHT) directControlState = 2;
            else if (!data.UP && !data.DOWN && data.LEFT && !data.RIGHT) directControlState = 3;
            else if (!data.UP && !data.DOWN && !data.LEFT && data.RIGHT) directControlState = 4;
            else if (data.UP && !data.DOWN && data.LEFT && !data.RIGHT) directControlState = 5;
            else if (data.UP && !data.DOWN && !data.LEFT && data.RIGHT) directControlState = 6;
            else if (!data.UP && data.DOWN && data.LEFT && !data.RIGHT) directControlState = 7;
            else if (!data.UP && data.DOWN && !data.LEFT && data.RIGHT) directControlState = 8;
            else directControlState = 9;
            socket.broadcast.emit('zumoDirectControlCommand', directControlState);
        }
    });
});

// Socket.io Custom Namespaces to not scramble root for ESP32s
const nspIndex = io.of('/index');
nspIndex.on('connection', function(socket) {
    console.log(Date().toString(), 'Made a socket connection. Socket ID:', socket.id);
    socket.emit('visitCounter', visitCounter);
    socket.emit('updateCompResources', compResources)
    socket.emit('updateUptime', secs2HHMMSS(process.uptime()));
    socket.emit('gitlog', gitcommits);
    socket.emit('updateGeo', visitCities);
});

const nspCharts = io.of('/charts');
nspCharts.on('connection', function(socket) {
    console.log(Date().toString(), 'Made a socket connection. Socket ID:', socket.id);
    socket.emit('updateCharts', sensorObjects);
});

// Sends out updated chart data after saving receiving new data from ESP32 
txEmitter.on('dataWritten', function() {
    nspCharts.emit('updateCharts', sensorObjects);
    checkMaxValue();
});

// Updates system information for serving it to the website/terminal  
var compResources = {};
function checkSysInfo() {
    si.cpuTemperature().then(data => compResources.CPUtemp = data.main);
    si.currentLoad().then(data => compResources.CPUload = data.currentload);
    si.mem().then(data => compResources.memuse = data.used / 1024 / 1024);
    si.mem().then(data => compResources.memtotal = data.total / 1024 / 1024);
    compResources.heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
    compResources.heapTotal = process.memoryUsage().heapTotal / 1024 / 1024;
    nspIndex.emit('updateCompResources', compResources);
}
// Check at startup; afterwards every 5 seconds
checkSysInfo();
setInterval(() => {
    checkSysInfo();
}, 5000);
// Updates server uptime for serving it to the website/terminal  
setInterval(() => {
    nspIndex.emit('updateUptime', secs2HHMMSS(process.uptime()));
}, 1000);
//>>>-------------------------------------------------<::>>>

//>>>- HTTP reqs -------------------------------------<::>>>
// Handles HTTP requests
app.get('/', (req, res) => {
    visitCounter += 1;
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url, "Request IP: ", req.ip, "Total requests: ", visitCounter);
    res.render('index');

    var geo = geoip.lookup(req.ip);
    if (geo !== null && geo.city !== null) {  
        if (geo.city == '') geo.city = geo.timezone;

        if (visitCities.hasOwnProperty(geo.city)) visitCities[geo.city] += 1;
        else visitCities[geo.city] = 1;
        nspIndex.emit('updateGeo', visitCities);
    }
});

app.get('/chat', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('chat');
});

app.get('/monitor', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('monitor');
});

app.get('/esp-login', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('esp_login');
});

app.get('/redirect', (req, res) => {
    if (requestOutput) console.log("REDIRECT", randomID);
    res.redirect(randomID);
});

app.get(randomID, (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('esp_upload');
});

// Receives sensor data
app.post('/post-test', function(req, res) {
    req.setEncoding('utf8');
    req.on('data', chunk => {
        tempData = chunk;
    });
    req.on('end', () => {
        tempData = JSON.parse(tempData);
        Object.getOwnPropertyNames(tempData).forEach(sensor => {
            tempData[sensor]["UNIX"] = Date.now();
        });
        if (requestOutput && measurementOutput) console.log(Date().toString(), "Received data: ", tempData);

        rxEmitter.emit('DBupdate');
    });
    res.sendStatus(200);

});

app.get("/get-data", (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.json(measuredData);;
});

app.get('/history', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('history');
});

app.get('/project-tasks', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('projectTasks');
});

app.get('/project-readings', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('projectReadings');
});

app.get('/project-dashboard', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('projectDashboard');
});

app.get('/project-avgval', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('projectAverageValue');
});

app.get('/project-min-max', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('projectMinMax');
});

app.get('/project-zumo-patterns', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('projectZumoPatterns');
});

// Handles ESP32 alarm requests 
var testServoUNIX = 0;
var testServoFlag = 0;
app.get('/alarm-check', (req, res) => {
    if (requestOutput && alarmOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    if (testServoFlag) res.send("test");
    else res.send(valAlarm);
});

// Handles ESP32 alarm test servo requests 
app.post('/test-servo', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    req.setEncoding('utf8');
    req.on('data', chunk => {
        let rxUNIX = parseInt(chunk);
        if (rxUNIX - testServoUNIX > 5000) {
            testServoUNIX = rxUNIX;

            testServoFlag = 1;
            setTimeout(() => {
                testServoFlag = 0;
            }, 4999);
        }
    });
    res.sendStatus(200);
});

// Serves Zumo state machine commands
app.get('/zumo-control', (req, res) => {
    if (requestOutput && alarmOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.send(zumoCommand);
});

var zumoCommand = 'standby';
var zumoCommandUNIX = 0;
var zumoDirectControl = 0;

var lineFollowerBtnFlag = 0;
var RCControlBtnFlag = 0;
var directControlBtnFlag = 0;

// Handles zumo control state machine requests from website
app.post('/zumo-control-post', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    req.setEncoding('utf8');
    req.on('data', chunk => {
        let rxJSON = JSON.parse(chunk);
        let rxUNIX = parseInt(rxJSON.UNIX);

        if (rxUNIX - zumoCommandUNIX > 3000) {

            zumoCommandUNIX = rxUNIX;
            console.log(rxJSON);

            switch (rxJSON.COMMAND_TYPE) {
                case "PATTERN":
                    zumoCommand = rxJSON.COMMAND;
                    setTimeout(() => {
                        zumoCommand = 'standby';
                    }, 2999);
                    break;

                case "LINEFOLLOWER":
                    if (rxJSON.COMMAND == "followerStart") {
                        zumoCommand = "startLineFollower";
                        lineFollowerBtnFlag = 1;
                    } else if (rxJSON.COMMAND == "followerStop") {
                        zumoCommand = "stop";
                        lineFollowerBtnFlag = 0;
                        setTimeout(() => {
                            zumoCommand = 'standby';
                        }, 2999);
                    }
                    io.emit('lineFollowerBtnUpdate', lineFollowerBtnFlag);
                    break;

                case "RCCONTROL":
                    if (rxJSON.COMMAND == "RCControlStart") {
                        zumoCommand = "startRCControl";
                        RCControlBtnFlag = 1;
                        setTimeout(() => {
                            zumoCommand = 'standby';
                        }, 2000);
                    } else if (rxJSON.COMMAND == "RCControlStop") {
                        zumoCommand = "stop";
                        RCControlBtnFlag = 0;
                        setTimeout(() => {
                            zumoCommand = 'standby';
                        }, 2000);
                    }
                    io.emit('RCControlBtnUpdate', RCControlBtnFlag);
                    break;

                case "DIRECTCONTROL":
                    if (rxJSON.COMMAND == "directControlStart") {
                        zumoCommand = "startDirectControl";
                        directControlBtnFlag = 1;
                        zumoDirectControl = 1;
                        setTimeout(() => {
                            zumoCommand = 'standby';
                        }, 2000);
                    } else if (rxJSON.COMMAND == "directControlStop") {
                        zumoCommand = "stop";
                        directControlBtnFlag = 0;
                        zumoDirectControl = 0;
                        setTimeout(() => {
                            zumoCommand = 'standby';
                        }, 2000);
                    }
                    io.emit('directControlBtnUpdate', directControlBtnFlag);

                default:
                    break;
            }
        }
    });
    res.sendStatus(200);
});

app.get('/control', (req, res) => {
    if (requestOutput) console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('zumoControl');
});
//>>>-------------------------------------------------<::>>>

//>>>- Handle data intake and process it to the database -<::>>>
rxEmitter.on('DBupdate', function() {
    Object.getOwnPropertyNames(tempData).forEach(sensor => {
        let saveToDB = 0;
        // Last save data
        if (tempData[sensor]["UNIX"] - lastSaveUNIX[sensor] > 60000 || !lastSaveUNIX.hasOwnProperty(sensor)) {
            lastSaveUNIX[sensor] = tempData[sensor]["UNIX"];
            saveToDB = 1;
        }

        // Add newest measurement to DB
        if (measuredData.hasOwnProperty(sensor)) {
            if (saveToDB) measuredData[sensor].push(tempData[sensor]);
            if (measuredData[sensor].length > 15000) measuredData[sensor].splice(0, 5000);
        } else {
            measuredData[sensor] = {};
            measuredData[sensor] = [tempData[sensor]];
        }

        // In case of receiving new sensor data
        if (!sensorObjects.hasOwnProperty(sensor)) {
            sensorObjects[sensor] = {};
            sensorObjects[sensor] = [tempData[sensor]];
        }

        // If DB doesnt yet have 100 measurements
        else if (measuredData[sensor].length <= 100) {
            sensorObjects[sensor] = {};
            sensorObjects[sensor] = measuredData[sensor].slice();
        }

        // Normal behaviour
        else {
            sensorObjects[sensor].push(tempData[sensor]);
            sensorObjects[sensor].shift();
        }
    });


    fs.writeFile(fileName, JSON.stringify(measuredData, null, 2), function writeJSON(err) {
        if (err) return console.log(err);


        txEmitter.emit('dataWritten');
    });
});
//>>>-------------------------------------------------<::>>>

//>>>-------------------------------------------------<::>>>
// Converts seconds to hours:minutes:seconds
function secs2HHMMSS(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var secs = Math.floor(seconds - (hours * 3600) - (minutes * 60));

    var padding = function(num) { return (num < 10) ? ("0" + num) : num }

    var time = padding(hours) + ':' + padding(minutes) + ':' + padding(secs);
    return time;
}

// Calculates max value for each measurement in the data container 
function calcMaxValue() {
    let overThresholds = 0;

    Object.getOwnPropertyNames(sensorObjects).forEach(sensorName => {
        let maxVal = 0;
        let measurementName = '';
        Object.getOwnPropertyNames(sensorObjects[sensorName]).forEach(measurementSet => {
            let measurement = sensorObjects[sensorName][measurementSet];

            for (let [key, value] of Object.entries(measurement)) {
                // console.log(`${key}: ${value}`);
                if (key != 'UNIX' && value > maxVal) {
                    measurementName = key;
                    // console.log(key, " max value: ", maxVal);

                    maxVal = value;
                    maxValues[key] = maxVal;
                }
            }
        })
    })
    for (let [key, value] of Object.entries(maxValues)) {
        if (maxValues[key] > maxValueThresholds[key]) overThresholds++;
    }
    if (overThresholds >= num_of_thresholds) valAlarm = true;
    else valAlarm = false;
}

// Checks if last received sensor value was over the set threshold
function checkMaxValue() {
    let overThresholds = 0;

    Object.getOwnPropertyNames(sensorObjects).forEach(sensorName => {
        let sensorArray = sensorObjects[sensorName];

        for (let [key, value] of Object.entries(sensorArray[sensorArray.length - 1])) {
            if (maxValueThresholds[key] < value) overThresholds++;
        }
    })
    if (overThresholds >= num_of_thresholds && valAlarm == false) {
        valAlarm = true;
        setTimeout(() => {
            valAlarm = false;
        }, 10000);
    }
}
