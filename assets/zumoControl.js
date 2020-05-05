var socket = io.connect('/');

const xhttp = new XMLHttpRequest();
const urlZumo = "/zumo-control-post";

var isLeftPressed = 0;
var isRightPressed = 0;
var isUpPressed = 0;
var isDownPressed = 0;
var elsePressed = 0;

const toggleBtn = document.getElementById("toggleControl");
var directControlToggle = 0;

$(document).keydown(function(e) {
    if (e.which == 37) {
        isLeftPressed = 1;
        $('.left').addClass('pressed');
        $('.lefttext').text('LEFT');
        $('.left').css('transform', 'translate(0, 2px)');
    } else if (e.which == 38) {
        isUpPressed = 1;
        $('.up').addClass('pressed');
        $('.uptext').text('UP');
        $('.left').css('transform', 'translate(0, 2px)');
        $('.down').css('transform', 'translate(0, 2px)');
        $('.right').css('transform', 'translate(0, 2px)');
    } else if (e.which == 39) {
        isRightPressed = 1;
        $('.right').addClass('pressed');
        $('.righttext').text('RIGHT');
        $('.right').css('transform', 'translate(0, 2px)');
    } else if (e.which == 40) {
        isDownPressed = 1;
        $('.down').addClass('pressed');
        $('.downtext').text('DOWN');
        $('.down').css('transform', 'translate(0, 2px)');
    } else if (e.which == 66) {
        toggleBtn.className = "w3-button w3-grey w3-border w3-border-black w3-large";
    } else {
        elsePressed = 1;
    }
    if (!elsePressed) {
        socket.emit('zumoDirectControl', {
            UP: isUpPressed,
            DOWN: isDownPressed,
            RIGHT: isRightPressed,
            LEFT: isLeftPressed
        });
        console.log("UP: ", isUpPressed, "   DOWN: ", isDownPressed, "  LEFT: ", isLeftPressed, "  RIGHT: ", isRightPressed);
    }
});

$(document).keyup(function(e) {
    if (e.which == 37) {
        isLeftPressed = 0;
        $('.left').removeClass('pressed');
        $('.lefttext').text('');
        $('.left').css('transform', 'translate(0, 0)');
    } else if (e.which == 38) {
        isUpPressed = 0;
        $('.up').removeClass('pressed');
        $('.uptext').text('');
        $('.left').css('transform', 'translate(0, 0)');
        $('.down').css('transform', 'translate(0, 0)');
        $('.right').css('transform', 'translate(0, 0)');
    } else if (e.which == 39) {
        isRightPressed = 0;
        $('.right').removeClass('pressed');
        $('.righttext').text('');
        $('.right').css('transform', 'translate(0, 0)');
    } else if (e.which == 40) {
        isDownPressed = 0;
        $('.down').removeClass('pressed');
        $('.downtext').text('');
        $('.down').css('transform', 'translate(0, 0)');
    } else if (e.which == 66) {
        console.log("TOGGLE RELEASED");
        toggleBtn.click();
        toggleBtn.className = "w3-button w3-red w3-border w3-border-black w3-large";
    }
    if (!elsePressed) {
        socket.emit('zumoDirectControl', {
            UP: isUpPressed,
            DOWN: isDownPressed,
            RIGHT: isRightPressed,
            LEFT: isLeftPressed
        });
        console.log("UP: ", isUpPressed, "   DOWN: ", isDownPressed, "  LEFT: ", isLeftPressed, "  RIGHT: ", isRightPressed);
    } else {
        elsePressed = 0;
    }
});

$('.left').mousedown(function() {
    isLeftPressed = 1;
    $('.lefttext').text('LEFT');
    $('.left').css('transform', 'translate(0, 2px)');
});

$('.left').mouseup(function() {
    isLeftPressed = 0;
    $('.lefttext').text('');
    $('.left').css('transform', 'translate(0, 0)');
});

$('.right').mousedown(function() {
    isRightPressed = 1;
    $('.righttext').text('RIGHT');
    $('.right').css('transform', 'translate(0, 2px)');
});

$('.right').mouseup(function() {
    isRightPressed = 0;
    $('.righttext').text('');
    $('.right').css('transform', 'translate(0, 0)');
});

$('.up').mousedown(function() {
    isUpPressed = 1;
    $('.uptext').text('UP');
    $('.left').css('transform', 'translate(0, 2px)');
    $('.down').css('transform', 'translate(0, 2px)');
    $('.right').css('transform', 'translate(0, 2px)');
});

$('.up').mouseup(function() {
    isUpPressed = 0;
    $('.uptext').text('');
    $('.left').css('transform', 'translate(0, 0)');
    $('.down').css('transform', 'translate(0, 0)');
    $('.right').css('transform', 'translate(0, 0)');
});

$('.down').mousedown(function() {
    isDownPressed = 1;
    $('.downtext').text('DOWN');
    $('.down').css('transform', 'translate(0, 2px)');
});

$('.down').mouseup(function() {
    isDownPressed = 0;
    $('.downtext').text('');
    $('.down').css('transform', 'translate(0, 0)');
});

document.getElementsByClassName("keys")[0].addEventListener('mousedown', e => {
    socket.emit('zumoDirectControl', {
        UP: isUpPressed,
        DOWN: isDownPressed,
        RIGHT: isRightPressed,
        LEFT: isLeftPressed
    });
    console.log("UP: ", isUpPressed, "   DOWN: ", isDownPressed, "  LEFT: ", isLeftPressed, "  RIGHT: ", isRightPressed);
});

document.getElementsByClassName("keys")[0].addEventListener('mouseup', e => {
    socket.emit('zumoDirectControl', {
        UP: isUpPressed,
        DOWN: isDownPressed,
        RIGHT: isRightPressed,
        LEFT: isLeftPressed
    });
    console.log("UP: ", isUpPressed, "   DOWN: ", isDownPressed, "  LEFT: ", isLeftPressed, "  RIGHT: ", isRightPressed);
});

toggleBtn.addEventListener('mousedown', e => {
    toggleBtn.className = "w3-button w3-grey w3-border w3-border-black w3-large";
});

toggleBtn.addEventListener('mouseup', e => {
    console.log("TOGGLE RELEASED");
    toggleBtn.click();
    toggleBtn.className = "w3-button w3-red w3-border w3-border-black w3-large";
});

socket.on('directControlBtnUpdate', function(flag) {
    console.log("ksdjngkjnsgd");
    directControlToggle = flag;
    toggleBtn.disabled = true;
    setTimeout(() => {
        toggleBtn.disabled = false;
    }, 3100);
    if (flag) toggleBtn.className = "w3-button w3-red w3-border w3-border-black w3-large";
    else toggleBtn.className = "w3-button w3-green w3-border w3-border-black w3-large";
})

function toggleControl() {
    xhttp.open("POST", urlZumo, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    directControlToggle = !directControlToggle;
    toggleBtn.disabled = true;
    setTimeout(() => {
        toggleBtn.disabled = false;
    }, 3100);
    if (directControlToggle) {
        xhttp.send(JSON.stringify({ "COMMAND_TYPE": "DIRECTCONTROL", "COMMAND": "directControlStart", "UNIX": Date.now() }));
    } else {
        xhttp.send(JSON.stringify({ "COMMAND_TYPE": "DIRECTCONTROL", "COMMAND": "directControlStop", "UNIX": Date.now() }));
    }
}