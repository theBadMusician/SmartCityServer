// Load google charts
google.charts.load('current', { 'packages': ['gauge'] });
google.charts.setOnLoadCallback(drawGaugeCharts);

// Make connection
var socket = io.connect('http://88.91.42.155:80');

// Query DOM
let visitCounter = document.getElementById('visit-counter');
let serverUptime = document.getElementById('server-uptime');
let gaugeCharts = document.getElementsByClassName('gauge');

for (var chart = 0; chart < gaugeCharts.length; chart++) {
    gaugeCharts[chart]['style']['display'] = 'inline-block';
}

window.addEventListener('resize', function () {
    if (window.innerWidth >= 976) window.dash_open = true;
    else window.dash_open = false;
    google.charts.setOnLoadCallback(drawGaugeCharts);
});

socket.on('updateUptime', function (data) {
    serverUptime.innerHTML = data;
});

// RX socket event
socket.on('visitCounter', function (data) {
    visitCounter.innerHTML = data;
});

socket.on('gitlog', function (data) {
    var gitlog = document.getElementsByClassName('w3-table-all');
    gitlog[0].innerHTML = '';
    for (var log = 0; log < data.length; log++) {
        gitlog[0].innerHTML += "<tr><td>" + data[log].abbrevHash + "</td><td>"
                            + data[log].subject + "</td><td><i>"
                            + data[log].authorDateRel + "</i></td></tr>";
    }
});

var compResources = {};
socket.on('updateCompResources', function (data) {
    compResources.CPUtemp = data.CPUtemp;
    compResources.CPUload = data.CPUload;
    compResources.memuse = data.memuse;
    compResources.heapUsed = data.heapUsed;
    compResources.heapTotal = Math.round((data.heapTotal + Number.EPSILON) * 100) / 100;
    console.log(compResources);
    google.charts.setOnLoadCallback(drawGaugeCharts);
});

var drawGaugeCharts = function () {
    var CPUload = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['CPU [%]', Math.round((compResources.CPUload + Number.EPSILON) * 100) / 100]
    ]);
    var CPUtemp = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Temp [°C]', compResources.CPUtemp]
    ]);
    var memuse = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Memory [MB]', Math.round(compResources.memuse)]
    ]);
    var heapuse = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Heap [MB]', Math.round((compResources.heapUsed + Number.EPSILON) * 100) / 100]
    ]);

    var optionsCPUload = {
        width: window.innerWidth/6, height: window.innerWidth/6,
        redFrom: 90, redTo: 100,
        yellowFrom: 75, yellowTo: 90,
        minorTicks: 5,
        animation: {duration: 600}
    };

    var optionsCPUtemp = {
        width: window.innerWidth/6, height: window.innerWidth/6,
        redFrom: 75, redTo: 100,
        yellowFrom: 65, yellowTo: 75,
        minorTicks: 5
    };

    var optionsMemuse = {
        width: window.innerWidth/6, height: window.innerWidth/6,
        max: 1024,
        redFrom: 818, redTo: 1024,
        yellowFrom: 612, yellowTo: 818,
        minorTicks: 5
    };

    var optionsHeapuse = {
        width: window.innerWidth/6, height: window.innerWidth/6,
        max: compResources.heapTotal,
        redFrom: compResources.heapTotal * 0.8, redTo: compResources.heapTotal,
        yellowFrom: compResources.heapTotal * 0.6, yellowTo: compResources.heapTotal * 0.8,
        minorTicks: 5
    };

    var chartCPUload = new google.visualization.Gauge(document.getElementById('chart_CPUload'));
    var chartCPUtemp = new google.visualization.Gauge(document.getElementById('chart_CPUtemp'));
    var chartMemuse = new google.visualization.Gauge(document.getElementById('chart_memuse'));
    var chartHeapuse = new google.visualization.Gauge(document.getElementById('chart_heapuse'));

    chartCPUload.draw(CPUload, optionsCPUload);
    chartCPUtemp.draw(CPUtemp, optionsCPUtemp);
    chartMemuse.draw(memuse, optionsMemuse);
    chartHeapuse.draw(heapuse, optionsHeapuse);
}