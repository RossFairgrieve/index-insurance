// Define base trace for scatterplots
var traceScatBlank = {
  mode: 'lines+markers', // could use 'lines+markers'
  marker: {
    size: 15,
    opacity: 0.9,
    // color: '#ff6e40'
    color:'#224d73'
  },
  hovertemplate:'<b>Strike Level:</b> %{text}kg/ha<extra></extra>',
  hoverinfo: '',
  line: {shape: 'spline', smoothing: 1.3}
};


// Define layout for scatterplots
var layoutScat = {
  title: {
    text: '<span style="font-weight: bold; text-transform: uppercase;">Overall insurance performance<br>at various strike levels</span>',
    font: {
      size: 14,
      color: '#000000'
    },
    y: 0.94
  },
  xaxis: {
    range: [0, 50.1],
    title: {
      text: '<span style="font-weight: bold;">Mean insurance cost as % of harvest value</span>',
      font: {
        size: 12,
        color: '#000000'
      },
      standoff: 0
    }
  },
  yaxis: {
    range: [0, 100.5],
    title: {
      text: '<span style="font-weight: bold;">Reduction in total<br>critical shortfall (%)</span>',
      font: {
        size: 12,
        color: '#000000'
      },
      standoff: 0
    }
  },
  hovermode: 'closest',
  showlegend: false,
  margin: {
    l: 100,
    r: 100,
    b: 50,
    t: 50,
    pad: 0
  },
  plot_bgcolor:'rgba(255, 255, 255, 0.90)',
  paper_bgcolor:'transparent'
};

// -------------------------------------


// Declare base traces and layouts for heatmaps
var traceHeatmapBase = {
  type: 'heatmap',
  xaxis: 'x',
  yaxis:'y',
  xgap: 1,
  ygap: 1,
  zmax: 0,
  zmin: -4000,
  colorscale: 'Hot',
  hovertemplate:'',
  colorbar: {
    thickness: 15,
    tickangle: 270,
    tickfont: {
      size: 12
    }
  }
};

var layoutHeatmapBase = {
  xaxis: {
    showline: true,
    linecolor: '#999999',
    mirror: true,
    title: {
      text: '<b>Year</b>',
      standoff: 0
    }
  },

  yaxis: {
    showline: true,
    linecolor: '#999999',
    // linewidth: 2,
    mirror: true,
    // tickson: 'boundaries',
    tickmode: 'linear',
    tick0: 0,
    dtik: 1,
    ticklen: 2,
    showticklabels: false,
    showgrid: false,
    title: {
      text: '<b>Individual farms</b>'
    }
  },

  margin: {
    l: 25,
    r: 25,
    b: 50,
    t: 50,
    pad: 0,
  },
  plot_bgcolor:'rgb(255, 255, 255)',
  paper_bgcolor:'transparent',
  title: {
    // text: '<b>Critical shortfall<br>No insurance (kg)</b>',
    font: {
      size: 14
    },
  }
};


// -------------------------------------


function drawHeatmap(d=null) {
  const request = new XMLHttpRequest();

  const bundles = document.querySelector('#bundles').value;
  const targetmargin = document.querySelector('#targetmargin').value;
  const minpayout = document.querySelector('#minpayout').value;
  const maxpayout = document.querySelector('#maxpayout').value;
  const kgperperson = document.querySelector('#kgperperson').value;
  const interest = document.querySelector('#interest').value;
  const deposit = document.querySelector('#deposit').value;

  var strikes = []
  for (var i = 0; i <= 6000; i += 500) {
    strikes.push(i);
  }

  if (d == null) {
    var strike = strikes[pointNumber];
  } else {
    var strike = strikes[d.points[0].pointNumber];
  }

  request.open('POST', '/heatmap');
  request.onload = function() {
    heatmapData = JSON.parse(request.responseText);

    var traceCritNoins = JSON.parse(JSON.stringify(traceHeatmapBase));
    traceCritNoins.z = heatmapData['cl_noins'];
    traceCritNoins.x = heatmapData['columns'];
    traceCritNoins.y = heatmapData['sitenames'];

    var traceCritIns = JSON.parse(JSON.stringify(traceCritNoins));
    traceCritIns.z = heatmapData['cl_ins'];

    var traceImp = JSON.parse(JSON.stringify(traceCritNoins));
    traceImp.z = heatmapData['improvement'];
    traceImp.colorscale = [['0.0', 'rgb(175,0,0)'], ['0.5', 'rgb(255,255,255)'], ['1.0', 'rgb(0,170,0)']];
    traceImp.zmax = 3500;
    traceImp.zmid = 0;
    traceImp.zmin = -3500;

    var layoutNoins = JSON.parse(JSON.stringify(layoutHeatmapBase));
    var layoutIns = JSON.parse(JSON.stringify(layoutHeatmapBase));
    var layoutImp = JSON.parse(JSON.stringify(layoutHeatmapBase));

    layoutNoins.title.text = '<b>Critical shortfall<br>No insurance (kg)</b>';
    layoutIns.title.text = '<b>Critical shortfall<br>With insurance (kg)</b>';
    layoutImp.title.text = '<b>Change with<br>insurance (kg)</b>';

    Plotly.newPlot('heatmap1', [traceCritNoins], layoutNoins, {displayModeBar: false});
    Plotly.newPlot('heatmap2', [traceCritIns], layoutIns, {displayModeBar: false});
    Plotly.newPlot('heatmap3', [traceImp], layoutImp, {displayModeBar: false});

    document.getElementById('heatmap1').on('plotly_click', heatmapInfo);
    document.getElementById('heatmap2').on('plotly_click', heatmapInfo);
    document.getElementById('heatmap3').on('plotly_click', heatmapInfo);

  };

  // Add data to send with request
  const hdata = new FormData();
  hdata.append('bundles', bundles);
  hdata.append('targetmargin', targetmargin);
  hdata.append('minpayout', minpayout);
  hdata.append('maxpayout', maxpayout);
  hdata.append('strike', strike);
  hdata.append('kgperperson', kgperperson);
  hdata.append('interest', interest);
  hdata.append('deposit', deposit);
  // hdata.append('region', region);

  // Send request
  request.send(hdata);
  return false;

}


// -------------------------------------


function changePoint(e) {
  pointNumber = e.points[0].pointNumber
}


// -------------------------------------


function scatterInfo(e) {
  document.getElementById('strike').innerHTML = graphData['strikes'][e.points[0].pointNumber].toString() + ' kg/ha';
  document.getElementById('cls-red').innerHTML = (Math.round(graphData['clsr_list'][e.points[0].pointNumber] * 10) / 10).toFixed(1).toString() + ' %';
  document.getElementById('prems-as-pc').innerHTML = (Math.round(graphData['premsaspc_list'][e.points[0].pointNumber] * 10) / 10).toFixed(1).toString() + ' %';
  document.getElementById('real-margin').innerHTML = (Math.round(graphData['realised_margin'][e.points[0].pointNumber] * 10) / 10).toFixed(1).toString() + ' %';
}


// -------------------------------------


function heatmapInfo(e) {
  document.getElementById('site-year').innerHTML = heatmapData['sitenames'][e.points[0].pointNumber[0]] + ' - ' + heatmapData['columns'][e.points[0].pointNumber[1]];
  document.getElementById('index-yield').innerHTML = heatmapData['indexyields'][e.points[0].pointNumber[0]][e.points[0].pointNumber[1]].toString() + ' kg/ha';
  document.getElementById('real-yield').innerHTML = heatmapData['realyields'][e.points[0].pointNumber[0]][e.points[0].pointNumber[1]].toString() + ' kg/ha';
  document.getElementById('crit-loss-noins').innerHTML = -(Math.round(heatmapData['cl_noins'][e.points[0].pointNumber[0]][e.points[0].pointNumber[1]])).toString() + ' kg';
  document.getElementById('crit-loss-ins').innerHTML = -(Math.round(heatmapData['cl_ins'][e.points[0].pointNumber[0]][e.points[0].pointNumber[1]])).toString() + ' kg';
  var sign = '';
  var startHtml = ''
  var endHtml = ''
  if (heatmapData['improvement'][e.points[0].pointNumber[0]][e.points[0].pointNumber[1]] > 0) {
    sign = '+';
    startHtml = '<span style="color: green">';
    endHtml = '</span>';
  } else if (heatmapData['improvement'][e.points[0].pointNumber[0]][e.points[0].pointNumber[1]] < 0) {
    startHtml = '<span style="color: red">';
    endHtml = '</span>';
  }
  document.getElementById('improvement').innerHTML = startHtml + sign + (Math.round(heatmapData['improvement'][e.points[0].pointNumber[0]][e.points[0].pointNumber[1]]).toString()) + ' kg' + endHtml;
}


// -------------------------------------


document.addEventListener('DOMContentLoaded', () => {

    // Initialize pointNumber to 4
    pointNumber=4;

    Plotly.newPlot('scattergraph', [], layoutScat, {displayModeBar: false});

    // Create blank heatmap axes to show initially
    const requestBlank = new XMLHttpRequest();

    requestBlank.open('POST', '/blankheatmaps');

    requestBlank.onload = () => {
      heatmapDataBlank = JSON.parse(requestBlank.responseText);

      // Define and plot blank heatmaps with correct layout
      var traceCritBlank = JSON.parse(JSON.stringify(traceHeatmapBase));
      traceCritBlank.z = heatmapDataBlank['zeros'];
      traceCritBlank.x = heatmapDataBlank['columns'];

      var traceImpBlank = JSON.parse(JSON.stringify(traceCritBlank));
      traceImpBlank.colorscale = [['0.0', 'rgb(175,0,0)'], ['0.5', 'rgb(255,255,255)'], ['1.0', 'rgb(0,170,0)']];
      traceImpBlank.zmax = 3500;
      traceImpBlank.zmid = 0;
      traceImpBlank.zmin = -3500;

      var layout1 = JSON.parse(JSON.stringify(layoutHeatmapBase));
      var layout2 = JSON.parse(JSON.stringify(layoutHeatmapBase));
      var layout3 = JSON.parse(JSON.stringify(layoutHeatmapBase));

      layout1.title.text = '<b>Critical shortfall<br>No insurance (kg)</b>'
      layout2.title.text = '<b>Critical shortfall<br>With insurance (kg)</b>'
      layout3.title.text = '<b>Change with<br>insurance (kg)</b>'

      Plotly.newPlot('heatmap1', [traceCritBlank], layout1, {displayModeBar: false});
      Plotly.newPlot('heatmap2', [traceCritBlank], layout2, {displayModeBar: false});
      Plotly.newPlot('heatmap3', [traceImpBlank], layout3, {displayModeBar: false});
    };

    // Add data to send with request
    const dataBlank = new FormData();

    // Send request
    requestBlank.send(dataBlank);



    // When the form is submitted, plot the scatterplot
    document.querySelector('#form').onsubmit = () => {

        // Initialize new request
        const request = new XMLHttpRequest();

        // Gather data from form
        const bundles = document.querySelector('#bundles').value;
        const targetmargin = document.querySelector('#targetmargin').value;
        const minpayout = document.querySelector('#minpayout').value;
        const maxpayout = document.querySelector('#maxpayout').value;
        const kgperperson = document.querySelector('#kgperperson').value;
        const interest = document.querySelector('#interest').value;
        const deposit = document.querySelector('#deposit').value;

        // Open request to /updategraphs route
        request.open('POST', '/updategraphs');

        // Callback function for when request completes
        request.onload = () => {

            // Extract JSON data from request
            graphData = JSON.parse(request.responseText);

            // Define traces and layouts
            var traceScat= JSON.parse(JSON.stringify(traceScatBlank));
            traceScat.x = graphData['premsaspc_list'];
            traceScat.y = graphData['clsr_list'];
            traceScat.text = graphData['strikes'];

            // Plot scatterplot with Plotly
            Plotly.newPlot('scattergraph', [traceScat], layoutScat, {displayModeBar: false});
            scatterPlot = document.getElementById('scattergraph');
            scatterPlot.on('plotly_click', changePoint);
            scatterPlot.on('plotly_click', scatterInfo);
            scatterPlot.on('plotly_click', drawHeatmap);


        };

        // Add data to send with request
        const data = new FormData();
        data.append('bundles', bundles);
        data.append('targetmargin', targetmargin);
        data.append('minpayout', minpayout);
        data.append('maxpayout', maxpayout);
        data.append('kgperperson', kgperperson);
        data.append('interest', interest);
        data.append('deposit', deposit);

        // Send request
        request.send(data);
        return false;
    };

});
