// Make connection
var socket = io.connect('http://192.168.0.225:80');

// Query DOM
var message = document.getElementById('message'),
    handle = document.getElementById('handle'),
    btn = document.getElementById('send'),
    output = document.getElementById('output'),
    feedback = document.getElementById('feedback'),
    chatWindow = document.getElementById('chat-window');

// Emit events
btn.addEventListener('click', function() {
    if (message.value !== '') {
        socket.emit('chat', {
            message: message.value,
            handle: handle.value
        });
        message.value = "";
    };
});

// Execute a function when the user releases a key on the keyboard
message.addEventListener("keypress", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        btn.click();
    }
});

message.addEventListener('keypress', function() {
    socket.emit('typing', handle.value);
});

// Listen for events
socket.on('chat', function(data) {
    feedback.innerHTML = "";
    output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>';
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

socket.on('typing', function(data) {
    feedback.innerHTML = '<p><em>' + data + ' is typing a message...</em></p>';
});