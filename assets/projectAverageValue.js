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

var averageArray = [];

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

function calcAveragesInMatrix(array, value) {
    var valueArray = createArray(array[0].length - 1, 0);
    var arr = createArray(array[0].length - 1, 0);

    for (var IDX = 0; IDX < valueArray.length; IDX++) {
        valueArray[IDX].push(array[0][IDX + 1]);
        arr[IDX].push(array[0][IDX + 1]);
    }
    for (var row = array.length - 1; row > array.length - value - 1; row--) {
        for (var elem = 1; elem < array[row].length; elem++) {
            valueArray[elem - 1].push(array[row][elem]);
        }
    }

    for (var row = 0; row < valueArray.length; row++) {
        var sum = 0;
        for (var i = 1; i < valueArray[row].length; i++) {
            sum += valueArray[row][i];
        }
        var avg = sum / value;
        arr[row].push(Math.round(avg * 1000) / 1000);
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

function drawCharts() {
    drawDashboardChart();
    drawAverageChart();
}

// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawCharts);

// Make connection
// const socket = io.connect('http://88.91.42.155:80');
const socket = io('/charts');

window.addEventListener('resize', function() {
    if (window.innerWidth >= 976) window.dash_open = true;
    else window.dash_open = false;
    google.charts.setOnLoadCallback(drawCharts);
    repositionElements();
});

setTimeout(() => {
    repositionElements();
}, 1000);

var slider = document.getElementById("myRange");
var text = document.getElementById("value");
var output = document.getElementById("output");
output.innerHTML = slider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
    output.innerHTML = this.value;
    drawAverageChart();
}

// Param. examples:
// measurementArray = sensorTables.BMP280.temperature.slice();
// title = 'Temperature [°C]';
function drawDashboardChart() {
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

function drawAverageChart() {
    averageArray = calcAveragesInMatrix(chartArray, slider.value);
    var dataArray = averageArray.slice();
    dataArray.unshift(["Measurememnt", "Average"]);

    var data = google.visualization.arrayToDataTable(dataArray);

    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1,
        {
            calc: "stringify",
            sourceColumn: 1,
            type: "string",
            role: "annotation"
        }
    ]);

    var options = {
        title: "Averages of the Measurements",
        bar: { groupWidth: "50%" },
        height: chartHeight,
        width: window.innerWidth,
        backgroundColor: 'transparent',
        chartArea: {
            left: chartAreaLeftDash,
            top: '50px',
            right: chartAreaRight,
            width: '100%'
        }

    };

    if (window.dash_open == false) {
        options.chartArea.left = chartAreaLeftNoDash;
    } else {
        options.chartArea.left = chartAreaLeftDash;
    };

    var chart = new google.visualization.ColumnChart(document.getElementById("average-chart"));
    chart.draw(view, options);

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
                } else if (sensorTables[sensorName][measurement].length >= 100) {
                    sensorTables[sensorName][measurement] = [];
                } else if (dataUnitIdx == 0) sensorTables[sensorName][measurement] = [];

                sensorTables[sensorName][measurement].push([timeStamp, dataUnit[measurement]]);

            });
        }
    });

    var sensorList = Object.getOwnPropertyNames(sensorData).slice();
    chartArray = createArray(101, 0);
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

    chartArray = chartArray.filter(function(array) {
        return array.length != 0 && array.length >= measurementList.length - 1;
    });

    updateUNIX = false;
    google.charts.setOnLoadCallback(drawCharts);

});



function repositionElements() {
    if (dash_open) {
        document.getElementsByClassName("fa fa-line-chart fa-fw")[1]['style']['margin-left'] = (chartAreaLeftDash - 50) + "px";
        document.getElementsByClassName("w3-container w3-padding-16 w3-light-grey")[0]['style']['margin-left'] = (chartAreaLeftDash - 75) + "px";
        document.getElementsByClassName("slidecontainer")[0]['style']['margin-left'] = (chartAreaLeftDash - 50) + "px";
        document.getElementsByClassName("slidecontainer")[0]['style']['width'] = "80%";
        text['style']['margin-left'] = (chartAreaLeftDash - 50) + "px";
        output['style']['margin-left'] = (chartAreaLeftDash - 50) + "px";
    } else {
        document.getElementsByClassName("fa fa-line-chart fa-fw")[1]['style']['margin-left'] = chartAreaLeftNoDash + "px";
        document.getElementsByClassName("w3-container w3-padding-16 w3-light-grey")[0]['style']['margin-left'] = "0px";
        document.getElementsByClassName("slidecontainer")[0]['style']['margin-left'] = chartAreaLeftNoDash + "px";
        text['style']['margin-left'] = "50px"
        output['style']['margin-left'] = "50px";
    }
}