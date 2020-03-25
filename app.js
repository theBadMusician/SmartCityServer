var express = require('express');
var socket = require('socket.io');
var ejs = require('ejs');

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

    // Handle chat event
    socket.on('chat', function(data){
        console.log(data);
        io.sockets.emit('chat', data);
    });

    socket.on('typing', function(data){
      socket.broadcast.emit('typing', data);
    })
});

//HTTP reqs
app.get('/', (req, res) => {
    console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('test');
});

app.get('/chat', (req, res) => {
    console.log(Date().toString(), "Requested URL: ", req.url);
    res.render('chat');
});
