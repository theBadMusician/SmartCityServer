var express = require('express');
var socket = require('socket.io');
var secrets = require('./SECRETS.js');
var bodyParser = require('body-parser');
var events = require('events');
var uuid = require('node-uuid');
var fs = require('fs');

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var myEmitter = new events.EventEmitter();

//Initializing variables
let visitCounter = 0;
let rand_num = function() {return Math.floor(Math.random() * 4000) + 1000};

// Randomize increment time --------------------------------------------------<||>>
var n = 0;

function increment(){

  n++;
  return n;
}

setInterval(() => {
    increment();
    // console.log(rand_num());
}, rand_num());
//----------------------------------------------------------------------------<||>>

var randomID = '/'+uuid.v4();
/*
setInterval(() => {
    randomID = '/'+uuid.v4();
    console.log(randomID);
}, 10000);
*/

// App setup
const port = 80;

var app = express();
app.set('view engine', 'ejs');
var server = app.listen(port, function(){
    console.log('%s Listening for requests on port %d...', Date().toString(), port);
});

// Static files
app.use('/assets', express.static('assets'));

// Socket setup & pass server
var io = socket(server);
io.on('connection', (socket) => {

    console.log(Date().toString(), 'Made a socket connection. Socket ID:', socket.id);
    io.sockets.emit('visitCounter', visitCounter);

    // Handle chat events
    socket.on('chat', function(data){
        console.log(Date().toString(), data);
        io.sockets.emit('chat', data);
    });

    socket.on('typing', function(data){
      socket.broadcast.emit('typing', data);
    })

    // Handle monitor events
    socket.on('update', function(data){
        console.log(Date().toString(), data);
        io.sockets.emit('chat', data);
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

    // Emit events
    setInterval(() => {
    socket.emit('update', {
        temp: n,
        time: Date().toString().slice(16, 24)
        });
    }, 1000);

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

