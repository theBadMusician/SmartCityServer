// Initialize variables
var tempTable = [
    ['Time', 'Temperature [°C]']
  ];

var humidityTable = [
    ['Time', 'Humidity [g/m³]'], 
    [1, 23],
    [2, 87]
];

var lightTable = [
    ['Time', 'Light [lx]'],
    [1, 23],
    [2, 87]
];

// Make connection
var socket = io.connect('http://88.91.42.155:80');

// Query DOM
var mySidebar = document.getElementById("mySidebar");

//google.charts.load('current', {packages:['corechart']});

google.charts.load('current', {
    callback: function () {
        drawTempChart();
        drawHumidityChart();
        drawLightChart();
        window.addEventListener('resize', () => {
            drawTempChart();
            drawHumidityChart();
            drawLightChart();
        }, false);
    },
    packages:['corechart']});


// Set a callback to run when the Google Visualization API is loaded.
// google.charts.setOnLoadCallback(drawPieChart);
google.charts.setOnLoadCallback(drawTempChart);
google.charts.setOnLoadCallback(drawHumidityChart);
google.charts.setOnLoadCallback(drawLightChart);

window.addEventListener('resize', function () {
    if (window.innerWidth >= 976) window.dash_open = true;
    else window.dash_open = false;
});

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawTempChart() {
    var data = google.visualization.arrayToDataTable(tempTable);

    var options = {
      title: 'Temperature [°C]',
      curveType: '',
      legend: { position: 'none' },
      explorer: {
        actions: ['dragToZoom', 'rightClickToReset'],
        axis: 'horizontal',
        keepInBounds: true,
        maxZoomIn: 4.0
      },
      height: 600,
      width: window.innerWidth,
      chartArea:{
        left: 350,
        top: 20,
        right: 35,
        width: '100%'
        }
    };

    if (window.dash_open == false) {
        options.chartArea.left = 50;
    }
    else {
        options.chartArea.left = 350;
    };

    var chart = new google.visualization.LineChart(document.getElementById('temp_chart'));

    chart.draw(data, options);
};

function drawHumidityChart() {
    var data = google.visualization.arrayToDataTable(humidityTable);

    var options = {
      title: 'Humidity [g/m³]',
      curveType: '',
      legend: { position: 'none' },
      explorer: {
        actions: ['dragToZoom', 'rightClickToReset'],
        axis: 'horizontal',
        keepInBounds: true,
        maxZoomIn: 4.0
      },
      height: 600,
      width: window.innerWidth,
      chartArea:{
        left: 350,
        top: 20,
        right: 35,
        width: '100%'
        }
    };

    if (window.dash_open == false) {
        options.chartArea.left = 50;
    }
    else {
        options.chartArea.left = 350;
    };

    var chart = new google.visualization.LineChart(document.getElementById('humidity_chart'));

    chart.draw(data, options);
};

function drawLightChart() {
    var data = google.visualization.arrayToDataTable(lightTable);

    var options = {
      title: 'Light [lx]',
      curveType: '',
      legend: { position: 'none' },
      explorer: {
        actions: ['dragToZoom', 'rightClickToReset'],
        axis: 'horizontal',
        keepInBounds: true,
        maxZoomIn: 4.0
      },
      height: 600,
      width: window.innerWidth,
      chartArea:{
        left: 350,
        top: 20,
        right: 35,
        width: '100%'
        }
    };

    if (window.dash_open == false) {
        options.chartArea.left = 50;
    }
    else {
        options.chartArea.left = 350;
    };

    var chart = new google.visualization.LineChart(document.getElementById('light_chart'));

    chart.draw(data, options);
};

// Listen for events
socket.on('update', function(data){
    tempTable.push([data.time, data.temp]);
    if (tempTable.length >= 51) tempTable.splice(1, 1);
    drawTempChart();
});