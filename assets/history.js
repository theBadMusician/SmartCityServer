// Load google charts
google.charts.load('current', {
    'packages': ['gauge', 'corechart']
});
// google.charts.setOnLoadCallback(drawGaugeCharts);
// google.charts.setOnLoadCallback(drawPieChart);

// Make connection
const socket = io.connect('https://ubrukeligrobot.com:443', {secure: true});

window.addEventListener('resize', function () {
    if (window.innerWidth >= 976) window.dash_open = true;
    else window.dash_open = false;
});

socket.on('gitlog', function (data) {
    var gitlog = document.getElementsByClassName('w3-table-all');
    gitlog[0].innerHTML = '';

    for (var log = 0; log < data.length; log++) {
        if (log % 2 == 0) {
            gitlog[0].innerHTML += "<tr><td><a href='https://github.com/theBadMusician/SmartCityServer/tree/" + data[log].hash + "'>" + data[log].hash + 
                                   "</td><td><a href='https://github.com/theBadMusician/SmartCityServer/commit/" + data[log].hash + "'>"
                                + data[log].subject + "</td><td><i>"
                                + data[log].authorDate + "</i></td></tr>";
        }
        else {
            gitlog[0].innerHTML += "<tr style='background-color:#f2f2f2'><td><a href='https://github.com/theBadMusician/SmartCityServer/tree/" + data[log].hash + "'>" + data[log].hash + 
                                   "</td><td><a href='https://github.com/theBadMusician/SmartCityServer/commit/" + data[log].hash + "'>"
                                + data[log].subject + "</td><td><i>"
                                + data[log].authorDate + "</i></td></tr>";
        }
    }
});
