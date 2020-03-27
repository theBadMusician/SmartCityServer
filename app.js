var express = require('express');
var socket = require('socket.io');
var ejs = require('ejs');

//Initializing variables
let visitCounter = 0;

//----------------------------------------------------------------------------<||>>
var n = 0;

var i = Math.floor(Math.random() * 3);

function increment(){

  n++;
  return n;
}
//----------------------------------------------------------------------------<||>>

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

    //Handle monitor events
    socket.on('update', function(data){
        console.log(Date().toString(), data);
        io.sockets.emit('chat', data);
    });
    // Emit events
    setInterval(() => {
    increment();
    io.sockets.emit('update', {
        temp: n,
        time: Date().toString().slice(16, 24)
        });
    }, 1000);

});

//HTTP reqs
app.get('/', (req, res) => {
    visitCounter += 1;
    console.log(Date().toString(), "Requested URL: ", req.url);
    console.log("Visit count:", visitCounter);
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

