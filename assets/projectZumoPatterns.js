const xhttp = new XMLHttpRequest();
const url = "/zumo-control-post";

function driveSquareReq() {
    xhttp.open("POST", url, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({ "COMMAND_TYPE": "PATTERN", "COMMAND": "patternSquare", "UNIX": Date.now() }));
}

function driveCircleReq() {
    xhttp.open("POST", url, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({ "COMMAND_TYPE": "PATTERN", "COMMAND": "patternCircle", "UNIX": Date.now() }));
}

function driveLineReq() {
    xhttp.open("POST", url, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({ "COMMAND_TYPE": "PATTERN", "COMMAND": "patternLine", "UNIX": Date.now() }));
}

function driveSnakeReq() {
    xhttp.open("POST", url, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify({ "COMMAND_TYPE": "PATTERN", "COMMAND": "patternSnake", "UNIX": Date.now() }));
}