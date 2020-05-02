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

function drawCharts() {
    Object.getOwnPropertyNames(chartList).forEach(func => {
        chartList[func]();
    })
}

//google.charts.load('current', {packages:['corechart']});

google.charts.load('current', {
    callback: function() {
        console.log("Google charts loaded!");
    },
    packages: ['corechart']
});


// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawCharts);

// Make connection
// const socket = io.connect('http://88.91.42.155:80');
const socket = io('/charts');

window.addEventListener('resize', function() {
    if (window.innerWidth >= 976) window.dash_open = true;
    else window.dash_open = false;
    google.charts.setOnLoadCallback(drawCharts);
    repositionButtons();
});

setTimeout(() => {
    repositionButtons();
}, 1000);

// Param. examples:
// measurementArray = sensorTables.BMP280.temperature.slice();
// title = 'Temperature [°C]';
function drawAutomatedLineChart(measurementArray, title) {
    return function() {
        var chartName = title + '_chart';
        if (!document.getElementById("charts").innerHTML.includes(chartName)) {
            document.getElementById("charts").innerHTML += "<br><h2 id='" + title + "_header' class='chartheader'>" + title.replace(/_/, ' ') + "</h2><br>";
            document.getElementById("charts").innerHTML += "<div id=" + chartName + "></div>";
            chartNameList.push(title + "_button");
            document.getElementById("buttons").innerHTML += "<button id='" + title + "_button' style='width:25%' onclick=chartToggle('" + title + "')> Toggle " + title + " Chart </button><br>";
        }
        var dataArray = measurementArray;
        if (dataArray[0][0] != "Time") {
            dataArray.unshift(['Time', title]);
        }

        var data = google.visualization.arrayToDataTable(dataArray);

        var options = {
            titlePosition: 'none',
            title: title,
            curveType: '',
            legend: { position: 'none' },
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

        var chart = new google.visualization.LineChart(document.getElementById(chartName));

        chart.draw(data, options);
    }
}


// Listen for events
socket.on('updateCharts', function(sensorData) {
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

    sensorList.forEach(sensor => {
        measurementList.forEach(measurement => {
            var funcName = sensor + measurement;

            if (sensorTables[sensor].hasOwnProperty(measurement)) {
                chartList[funcName] = drawAutomatedLineChart(sensorTables[sensor][measurement], measurement);
            }
        });
    });

    google.charts.setOnLoadCallback(drawCharts);

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