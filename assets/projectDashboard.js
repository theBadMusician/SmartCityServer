// Initialize variables/objects
var chartHeight = 600,
    chartAreaLeftDash = 375,
    chartAreaLeftNoDash = 50,
    chartAreaTop = 20,
    chartAreaRight = 35;

var sensorTables = {}

var measurementList = [];
var chartList = {};
var chartNameList = [];

var chartArray = [];
var currentUNIX = 0;
var updateUNIX = false;

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

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while (i--) arr[length - 1 - i] = createArray.apply(this, args);
    }

    return arr;
}

//google.charts.load('current', {packages:['corechart']});

google.charts.load('current', {
    callback: function() {
        console.log("Google charts loaded!");
    },
    packages: ['corechart']
});


// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawDashboardChart);

// Make connection
const socket = io.connect('http://88.91.42.155:80');

window.addEventListener('resize', function() {
    if (window.innerWidth >= 976) window.dash_open = true;
    else window.dash_open = false;
    google.charts.setOnLoadCallback(drawDashboardChart);
    repositionButtons();
});

setTimeout(() => {
    repositionButtons();
}, 1000);

// Param. examples:
// measurementArray = sensorTables.BMP280.temperature.slice();
// title = 'Temperature [°C]';
function drawDashboardChart() {
    console.log(chartArray);
    var data = google.visualization.arrayToDataTable(chartArray);

    var options = {
        title: 'Dashboard',
        curveType: '',
        legend: { position: 'bottom' },
        explorer: {
            actions: ['dragToPan', 'rightClickToReset'],
            axis: 'horizontal',
            keepInBounds: true,
            maxZoomIn: 4.0
        },
        height: chartHeight,
        width: window.innerWidth,
        backgroundColor: 'transparent',
        chartArea: {
            left: chartAreaLeftDash,
            top: chartAreaTop,
            right: chartAreaRight,
            width: '100%'
        }
    };

    if (window.dash_open == false) {
        options.chartArea.left = chartAreaLeftNoDash;
    } else {
        options.chartArea.left = chartAreaLeftDash;
    };

    var chart = new google.visualization.LineChart(document.getElementById('dashboard-chart'));

    chart.draw(data, options);

}


// Listen for events
socket.on('updateCharts', function(sensorData) {
    if (Date.now() - currentUNIX >= 30000) {
        updateUNIX = true;
        currentUNIX = Date.now();
    }
    console.log("Update received.");
    var flag = 0;

    Object.getOwnPropertyNames(sensorData).forEach(sensorName => {
        // ["BMP280", "MQ-7", ...]
        //if (sensorArray.length < 50) return;
        var sensorArray = sensorData[sensorName];

        if (!sensorTables.hasOwnProperty(sensorName)) sensorTables[sensorName] = {};


        for (var dataUnitIdx = 0; dataUnitIdx < sensorArray.length; dataUnitIdx++) {
            var dataUnit = sensorArray[dataUnitIdx];
            var timeStamp = UNIXtoHHMMSS(dataUnit.UNIX);
            delete dataUnit.UNIX;

            Object.getOwnPropertyNames(dataUnit).forEach(measurement => {
                // ["temperature", "pressure", ...]

                if (!measurementList.includes(measurement)) measurementList.push(measurement);


                if (!sensorTables[sensorName].hasOwnProperty(measurement)) {
                    sensorTables[sensorName][measurement] = [];
                } else if (sensorTables[sensorName][measurement].length >= 50) {
                    sensorTables[sensorName][measurement] = [];
                } else if (dataUnitIdx == 0) sensorTables[sensorName][measurement] = [];

                sensorTables[sensorName][measurement].push([timeStamp, dataUnit[measurement]]);

            });
        }
    });

    var sensorList = Object.getOwnPropertyNames(sensorData).slice();
    chartArray = createArray(51, 0);
    for (place in chartArray) {
        place = new Array;
    }
    chartArray[0].push("Time");

    sensorList.forEach(sensor => {
        measurementList.forEach(measurement => {
            if (sensorTables[sensor].hasOwnProperty(measurement)) {
                if (!chartArray[0].includes(measurement)) chartArray[0].push(measurement);
                let sensorMeas = sensorTables[sensor][measurement];

                for (var index = 1; index < sensorMeas.length; index++) {
                    if (chartArray[index][0] != sensorMeas[index][0] && typeof chartArray[index][0] !== 'string') {
                        chartArray[index].unshift(sensorMeas[index][0]);
                    }
                    chartArray[index].push(sensorMeas[index][1]);
                }
            }
        });
    });
    console.log(sensorTables);
    chartArray = chartArray.filter(function(array) {
        return array.length != 0 && array.length >= measurementList.length - 1;
    });
    updateUNIX = false;
    google.charts.setOnLoadCallback(drawDashboardChart);

});

function chartToggle(title) {
    if (document.getElementById(title + "_chart").style.display === 'block') {
        document.getElementById(title + "_chart").style.display = 'none';
        document.getElementById(title + "_header").style.display = 'none';

    } else {
        document.getElementById(title + "_chart").style.display = 'block';
        document.getElementById(title + "_header").style.display = 'block';

    }
}

function repositionButtons() {
    if (dash_open) {
        document.getElementsByClassName("fa fa-line-chart fa-fw")[1]['style']['margin-left'] = (chartAreaLeftDash - 50) + "px";
        document.getElementsByClassName("w3-container w3-padding-16 w3-light-grey")[0]['style']['margin-left'] = (chartAreaLeftDash - 75) + "px";
        for (var IDX = 0; IDX < chartNameList.length; IDX++) {
            document.getElementById(String(chartNameList[IDX]))['style']['margin-left'] = chartAreaLeftDash + "px";
            document.getElementsByClassName('chartheader')[IDX]['style']['margin-left'] = chartAreaLeftDash + "px";
        }
    } else {
        document.getElementsByClassName("fa fa-line-chart fa-fw")[1]['style']['margin-left'] = chartAreaLeftNoDash + "px";
        document.getElementsByClassName("w3-container w3-padding-16 w3-light-grey")[0]['style']['margin-left'] = "0px";
        for (var IDX = 0; IDX < chartNameList.length; IDX++) {
            document.getElementById(String(chartNameList[IDX]))['style']['margin-left'] = chartAreaLeftNoDash + "px";
            document.getElementsByClassName('chartheader')[IDX]['style']['margin-left'] = chartAreaLeftNoDash + "px";
        }
    }
}