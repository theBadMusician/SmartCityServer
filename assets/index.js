// Load google charts
google.charts.load('current', {
    'packages': ['gauge', 'corechart']
});
google.charts.setOnLoadCallback(drawGaugeCharts);
google.charts.setOnLoadCallback(drawPieChart);

// Make connection
var socket = io.connect('http://88.91.42.155:80');

// Query DOM
let visitCounter = document.getElementById('visit-counter');
let serverUptime = document.getElementById('server-uptime');
let gaugeCharts = document.getElementsByClassName('gauge');

for (var chart = 0; chart < gaugeCharts.length; chart++) {
    gaugeCharts[chart]['style']['display'] = 'inline-block';
}

var thirdWidth = (window.innerWidth > 567) ? (window.innerWidth / 3.7) : window.innerWidth;
window.addEventListener('resize', function () {
    if (window.innerWidth >= 976) window.dash_open = true;
    else window.dash_open = false;
    google.charts.setOnLoadCallback(drawGaugeCharts);
    thirdWidth = (window.innerWidth > 567) ? (window.innerWidth / 3.7) : window.innerWidth;
    google.charts.setOnLoadCallback(drawPieChart);
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
        if (log % 2 == 0) {
            gitlog[0].innerHTML += "<tr><td>" + data[log].abbrevHash + "</td><td>"
                                + data[log].subject + "</td><td><i>"
                                + data[log].authorDateRel + "</i></td></tr>";
        }
        else {
            gitlog[0].innerHTML += "<tr style='background-color:#f2f2f2'><td>" + data[log].abbrevHash + "</td><td>"
                                + data[log].subject + "</td><td><i>"
                                + data[log].authorDateRel + "</i></td></tr>";
        }
    }
});

var compResources = {};
socket.on('updateCompResources', function (data) {
    compResources.CPUtemp = data.CPUtemp;
    compResources.CPUload = data.CPUload;
    compResources.memuse = data.memuse;
    compResources.memtotal = Math.floor(data.memtotal);
    compResources.heapUsed = data.heapUsed;
    compResources.heapTotal = Math.round((data.heapTotal + Number.EPSILON) * 100) / 100;
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

    var gaugeWidthHeight = (window.innerWidth > 567) ? window.innerWidth/5.25 : window.innerWidth/2.3;

    var optionsCPUload = {
        width: gaugeWidthHeight, height: gaugeWidthHeight,
        redFrom: 90, redTo: 100,
        yellowFrom: 75, yellowTo: 90,
        minorTicks: 5,
        animation: {duration: 600}
    };

    var optionsCPUtemp = {
        width: gaugeWidthHeight, height: gaugeWidthHeight,
        redFrom: 75, redTo: 100,
        yellowFrom: 65, yellowTo: 75,
        minorTicks: 5
    };

    var optionsMemuse = {
        width: gaugeWidthHeight, height: gaugeWidthHeight,
        max: compResources.memtotal,
        redFrom: compResources.memtotal * 0.8, redTo: compResources.memtotal,
        yellowFrom: compResources.memtotal * 0.6, yellowTo: compResources.memtotal * 0.8,
        minorTicks: 5
    };

    var optionsHeapuse = {
        width: gaugeWidthHeight, height: gaugeWidthHeight,
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

var cityArray = [['City', 'Visits']];
socket.on('updateGeo', function (data) {
    cityArray = [['City', 'Visits']];
    Object.getOwnPropertyNames(data).forEach(city => {
        cityArray.push([city, data[city]]);
    });
    console.log(cityArray);
    google.charts.setOnLoadCallback(drawPieChart);
});

function drawPieChart () {
    var data = google.visualization.arrayToDataTable(cityArray);

    var options = {
        title: 'Visits by City',
        titlePosition: 'none',
        width: thirdWidth,
        height: thirdWidth,
        backgroundColor: 'transparent',
        is3D: true,
        chartArea: {
            left: 20,
            width: '100%',
            height: '100%'
        }
    };

    var chart = new google.visualization.PieChart(document.getElementById('visit-chart'));

    chart.draw(data, options);
}