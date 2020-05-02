const socket = io.connect('http://88.91.42.155:80');

const xhttp = new XMLHttpRequest();
const urlServo = "/test-servo";
const urlZumo = "/zumo-control-post";

var lineFollowerBtn = document.getElementById("lineFollowerButton");
var RCBtn = document.getElementById("RCControlButton");

var isLineBtnPressed = 0;
var isRCBtnPressed = 0;

socket.on('lineFollowerBtnUpdate', function(flag) {
    isLineBtnPressed = flag;
    lineFollowerBtn.disabled = true;
    RCBtn.disabled = true;
    setTimeout(() => {
        lineFollowerBtn.disabled = false;
        if (!isLineBtnPressed) RCBtn.disabled = false;
    }, 5000);
    if (flag) lineFollowerBtn.className = "w3-button w3-deep-purple w3-border w3-border-black w3-large";
    else lineFollowerBtn.className = "w3-button w3-blue w3-border w3-border-black w3-large";
})

socket.on('RCControlBtnUpdate', function(flag) {
    isRCBtnPressed = flag;
    RCBtn.disabled = true;
    lineFollowerBtn.disabled = true;
    setTimeout(() => {
        RCBtn.disabled = false;
        if (!isRCBtnPressed) lineFollowerBtn.disabled = false;
    }, 3100);
    if (flag) RCBtn.className = "w3-button w3-deep-purple w3-border w3-border-black w3-large";
    else RCBtn.className = "w3-button w3-blue w3-border w3-border-black w3-large";
})

function testServoReq() {
    xhttp.open("POST", urlServo, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(Date.now());
}

function lineFollowerReq() {
    xhttp.open("POST", urlZumo, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    isLineBtnPressed = !isLineBtnPressed;
    lineFollowerBtn.disabled = true;
    RCBtn.disabled = true;
    setTimeout(() => {
        lineFollowerBtn.disabled = false;
        if (!isLineBtnPressed) RCBtn.disabled = false;
    }, 5000);
    if (isLineBtnPressed) {
        xhttp.send(JSON.stringify({ "COMMAND_TYPE": "LINEFOLLOWER", "COMMAND": "followerStart", "UNIX": Date.now() }));
    } else {
        xhttp.send(JSON.stringify({ "COMMAND_TYPE": "LINEFOLLOWER", "COMMAND": "followerStop", "UNIX": Date.now() }));
    }
}

function RCControlReq() {
    xhttp.open("POST", urlZumo, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    isRCBtnPressed = !isRCBtnPressed;
    RCBtn.disabled = true;
    lineFollowerBtn.disabled = true;
    setTimeout(() => {
        RCBtn.disabled = false;
        if (!isRCBtnPressed) lineFollowerBtn.disabled = false;
    }, 3100);
    if (isRCBtnPressed) {
        xhttp.send(JSON.stringify({ "COMMAND_TYPE": "RCCONTROL", "COMMAND": "RCControlStart", "UNIX": Date.now() }));
    } else {
        xhttp.send(JSON.stringify({ "COMMAND_TYPE": "RCCONTROL", "COMMAND": "RCControlStop", "UNIX": Date.now() }));
    }
}