// Make connection
var socket = io.connect('http://88.91.42.155:80');

// Query DOM
let visitCounter = document.getElementById('visit-counter');

// Emit events
socket.on('visitCounter', function(data){
      visitCounter.innerHTML = data;
});