// Load google charts
google.charts.load('current', { 'packages': ['gauge'] });
google.charts.setOnLoadCallback(drawGaugeCharts);

// Make connection
var socket = io.connect('http://88.91.42.155:80');

// Query DOM
let visitCounter = document.getElementById('visit-counter');
let gaugeCharts = document.getElementsByClassName('gauge');

for (var chart = 0; chart < gaugeCharts.length; chart++) {
    gaugeCharts[chart]['style']['display'] = 'inline-block';
}

window.addEventListener('resize', function () {
    if (window.innerWidth >= 976) window.dash_open = true;
    else window.dash_open = false;
    google.charts.setOnLoadCallback(drawGaugeCharts);
});

// Emit events
socket.on('visitCounter', function (data) {
    visitCounter.innerHTML = data;
});

var compResources = {};
socket.on('updateCompResources', function (data) {
    compResources.CPUtemp = data.CPUtemp;
    compResources.CPUload = data.CPUload;
    compResources.memuse = data.memuse;
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

    var optionsCPUload = {
        width: window.innerWidth/4, height: window.innerWidth/4,
        redFrom: 90, redTo: 100,
        yellowFrom: 75, yellowTo: 90,
        minorTicks: 5,
        animation: {duration: 600}
    };

    var optionsCPUtemp = {
        width: window.innerWidth/4, height: window.innerWidth/4,
        redFrom: 75, redTo: 100,
        yellowFrom: 65, yellowTo: 75,
        minorTicks: 5
    };

    var optionsMemuse = {
        width: window.innerWidth/4, height: window.innerWidth/4,
        max: 1024,
        redFrom: 818, redTo: 1024,
        yellowFrom: 612, yellowTo: 818,
        minorTicks: 5
    };

    var chartCPUload = new google.visualization.Gauge(document.getElementById('chart_CPUload'));
    var chartCPUtemp = new google.visualization.Gauge(document.getElementById('chart_CPUtemp'));
    var chartMemuse = new google.visualization.Gauge(document.getElementById('chart_memuse'));

    chartCPUload.draw(CPUload, optionsCPUload);
    chartCPUtemp.draw(CPUtemp, optionsCPUtemp);
    chartMemuse.draw(memuse, optionsMemuse);
}