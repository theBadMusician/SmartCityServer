const xhttp = new XMLHttpRequest();
const url = "/test-servo";

function testServoReq() {
    xhttp.open("POST", url, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(Date.now());
}