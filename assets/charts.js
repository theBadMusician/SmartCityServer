google.charts.load('current', {'packages':['corechart', ]});

// Set a callback to run when the Google Visualization API is loaded.
// google.charts.setOnLoadCallback(drawPieChart);
google.charts.setOnLoadCallback(drawTimeChart);

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawPieChart() {

    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Topping');
    data.addColumn('number', 'Slices');
    data.addRows([
      ['Mushrooms', 3],
      ['Onions', 1],
      ['Olives', 1],
      ['Zucchini', 1],
      ['Pepperoni', 2]
    ]);

    // Set chart options
    var options = {'title':'How Much Pizza I Ate Last Night',
                   'width':800,
                   'height':600};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
    chart.draw(data, options);
};

function drawTimeChart() {
    let year = 2004,
        sales = 1000,
        expenses = 400;
    var data = google.visualization.arrayToDataTable([
      ['Year', 'Sales', 'Expenses'],
      [year, sales, expenses]
    ]);

    var options = {
      title: 'Company Performance',
      curveType: '',
      legend: { position: 'right' },
      'width':1200,
      'height':500
    };

    var chart = new google.visualization.LineChart(document.getElementById('time_chart'));

    chart.draw(data, options);
};