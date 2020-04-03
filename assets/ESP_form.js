var pwd = document.getElementById('pwd'),
      btn = document.getElementById('send');

function check(form) {
    var socket = io.connect('http://88.91.42.155:80');
    socket.emit('ESP32login', {
        userid: form.userid.value,
        password: form.pwd.value
    });
    
    socket.on('correct', function (data) {
        window.open(data, "_self");
        });

    socket.on('incorrect', function (data) {
        alert('Error! Username and password were incorrect.');
    });
}

pwd.addEventListener("keypress", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      btn.click();
    }
});

function SubForm (){
    $.ajax({
        url:data,
        type:'get',
        data:$('loginForm').serialize(),
        success:function(){
            alert("worked");
        }
    });
    console.log($('loginForm'));
}