// Initialize variables/objects
var chartHeight         = 600,
    chartAreaLeftDash   = 375,
    chartAreaLeftNoDash = 50,
    chartAreaTop        = 20,
    chartAreaRight      = 35;    

var sensorTables = {
    BMP280: {
        temperature: [],
        pressure: [],
        altitude: []
    }
}

var sensorObjs = {};
var counter0 = 0;
var counter1 = 0;

function UNIXtoHHMMSS(UnixTimeStampInMillis) {
    var date = new Date(UnixTimeStampInMillis);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    
    // Will display time in 10:30:23 format
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}

function DBpushToArray(device, array, numItems) {
    if (numItems > device.length) throw RangeError("'numItems' is out of bounds for the 'array'.");

    for (var i = numItems; i > 0; i--) array.push(device[device.length - i]);
}

function DBshiftpushToArray(device, array, numItems) {
    if (numItems > device.length) throw RangeError("'numItems' is out of bounds for the 'array'.");

    for (var i = numItems; i > 0; i--) {
        array.shift();
        array.push(device[device.length - i]);
    }
}

// Make connection
const socket = io.connect('http://88.91.42.155:80');

// Query DOM
var mySidebar = document.getElementById("mySidebar");

//google.charts.load('current', {packages:['corechart']});

google.charts.load('current', {
    callback: function () {
        drawTemperatureChart();
        drawPressureChart();
        drawAltitudeChart();
        window.addEventListener('resize', () => {
            drawTemperatureChart();
            drawPressureChart();
            drawAltitudeChart();
        }, false);
    },
    packages:['corechart']});


// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawTemperatureChart);


window.addEventListener('resize', function () {
    if (window.innerWidth >= 976) window.dash_open = true;
    else window.dash_open = false;
});

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawTemperatureChart() {
    var dataArray = sensorTables.BMP280.temperature.slice();
    var beginning = ['Time', 'Temperature [°C]'];
    dataArray.unshift(beginning);
    var data = google.visualization.arrayToDataTable(dataArray);

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
        height: chartHeight,
        width: window.innerWidth,
        chartArea:{
            left: chartAreaLeftDash,
            top: chartAreaTop,
            right: chartAreaRight,
            width: '100%'
        }
    };

    if (window.dash_open == false) {
        options.chartArea.left = chartAreaLeftNoDash;
    }
    else {
        options.chartArea.left = chartAreaLeftDash;
    };

    var chart = new google.visualization.LineChart(document.getElementById('temperature_chart'));

    chart.draw(data, options);
};

function drawPressureChart() {
    var dataArray = sensorTables.BMP280.pressure.slice();
    dataArray.unshift(['Time', 'Pressure [hPa]']);
    var data = google.visualization.arrayToDataTable(dataArray);

    var options = {
        title: 'Pressure [hPa]',
        curveType: '',
        legend: { position: 'none' },
        explorer: {
            actions: ['dragToZoom', 'rightClickToReset'],
            axis: 'horizontal',
            keepInBounds: true,
            maxZoomIn: 4.0
        },
        height: chartHeight,
        width: window.innerWidth,
        chartArea:{
            left: chartAreaLeftDash,
            top: chartAreaTop,
            right: chartAreaRight,
            width: '100%'
        }
    };

    if (window.dash_open == false) {
        options.chartArea.left = chartAreaLeftNoDash;
    }
    else {
        options.chartArea.left = chartAreaLeftDash;
    };

    var chart = new google.visualization.LineChart(document.getElementById('pressure_chart'));

    chart.draw(data, options);
};

function drawAltitudeChart() {
    var dataArray = sensorTables.BMP280.altitude.slice();
    dataArray.unshift(['Time', 'Altitude [m]']);
    var data = google.visualization.arrayToDataTable(dataArray);

    var options = {
        title: 'Altitude [m]',
        curveType: '',
        legend: { position: 'none' },
        explorer: {
            actions: ['dragToZoom', 'rightClickToReset'],
            axis: 'horizontal',
            keepInBounds: true,
            maxZoomIn: 4.0
        },
        height: chartHeight,
        width: window.innerWidth,
        chartArea:{
            left: chartAreaLeftDash,
            top: chartAreaTop,
            right: chartAreaRight,
            width: '100%'
        }
    };

    if (window.dash_open == false) {
        options.chartArea.left = chartAreaLeftNoDash;
    }
    else {
        options.chartArea.left = chartAreaLeftDash;
    };

    var chart = new google.visualization.LineChart(document.getElementById('altitude_chart'));

    chart.draw(data, options);
};

// Listen for events
socket.on('update', function(sensorData){
    counter0 += 1;
    //console.log("update received", counter0, sensorData);
    
    Object.getOwnPropertyNames(sensorData).forEach(sensorName => {
        // ["BMP280", "MQ-7", ...]
        var sensorArray = sensorData[sensorName];

        for (var dataUnitIdx = 0; dataUnitIdx < sensorArray.length; dataUnitIdx++) {
            var dataUnit = sensorArray[dataUnitIdx];
            var timeStamp = UNIXtoHHMMSS(dataUnit.UNIX);
            delete dataUnit.UNIX;

            Object.getOwnPropertyNames(dataUnit).forEach(measurement => {
                // ["temperature", "pressure", ...]
                if (sensorTables[sensorName][measurement].length >= 50) sensorTables[sensorName][measurement] = [];
                sensorTables[sensorName][measurement].push([timeStamp, dataUnit[measurement]]);
            });
        }
    });
    counter1 = 0;
    drawTemperatureChart();
    drawPressureChart();
    drawAltitudeChart();
    console.log(sensorTables);
});