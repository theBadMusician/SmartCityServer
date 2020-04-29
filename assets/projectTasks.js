const xhttp = new XMLHttpRequest();
const urlServo = "/test-servo";
const urlZumo = "/zumo-control-post";

function testServoReq() {
    xhttp.open("POST", urlServo, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(Date.now());
}

function lineFollowerReq() {
    xhttp.open("POST", urlZumo, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({ "COMMAND_TYPE": "LINEFOLLOWER", "COMMAND": "followerToggle", "UNIX": Date.now() }));
}