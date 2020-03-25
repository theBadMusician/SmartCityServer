var express = require('express');
var socket = require('socket.io');

// App setup
var app = express();
var server = app.listen(80, function(){
    console.log('Listening for requests on port 80...');
});

// Static files
app.use(express.static('public'));

// Socket setup & pass server
var io = socket(server);
io.on('connection', (socket) => {

    console.log('Made a socket connection. Socket ID:', socket.id);

    // Handle chat event
    socket.on('chat', function(data){
        console.log(data);
        io.sockets.emit('chat', data);
    });

    socket.on('typing', function(data){
      socket.broadcast.emit('typing', data);
    })
});