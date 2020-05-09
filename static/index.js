

function drawHeatmap(d=null) {
  const request = new XMLHttpRequest();

  const bundles = document.querySelector('#bundles').value;
  const targetmargin = document.querySelector('#targetmargin').value;
  const minpayout = document.querySelector('#minpayout').value;
  const maxpayout = document.querySelector('#maxpayout').value;
  const kgperperson = document.querySelector('#kgperperson').value;
  const interest = document.querySelector('#interest').value;
  const deposit = document.querySelector('#deposit').value;
  const region = document.querySelector('#region').value;

  var strikes = []
  for (var i = 0; i <= 6000; i += 500) {
    strikes.push(i);
  }

  if (d == null) {
    var strike = strikes[pointNumber]
  } else {
    var strike = strikes[d.points[0].pointNumber];
  }

  request.open('POST', '/heatmap');
  request.onload = function() {
    heatmapData = JSON.parse(request.responseText);

    minCl = heatmapData['min_cl']

    // Define and plot heatmaps
    var trace1 = {
      z: heatmapData['cl_noins'], type: 'heatmap',
      x: heatmapData['columns'],
      y: [heatmapData['regions'], heatmapData['sitenames']],
      xaxis: 'x',
      yaxis:'y',
      xgap: 1,
      ygap: 1,
      zmax: 0,
      zmin: minCl,
      colorscale: 'Hot',
      showscale: false,
      text: heatmapData['indexyields'],
      hovertemplate:'Index-calculated yield: %{text} kg/ha'
      // colorbar: {x: -0.18}
    };

    var trace2 = {
      z: heatmapData['cl_ins'], type: 'heatmap',
      x: heatmapData['columns'],
      y: heatmapData['sitenames'],
      xaxis: 'x2',
      yaxis: 'y2',
      xgap: 1,
      ygap: 1,
      zmax: 0,
      zmin: minCl,
      colorscale: 'Hot',
      showscale: false
    };

    var trace3 = {
      z: heatmapData['improvement'], type: 'heatmap',
      x: heatmapData['columns'],
      y: heatmapData['sitenames'],
      xaxis: 'x3',
      yaxis: 'y3',
      xgap: 1,
      ygap: 1,
      // y: heatmapData['index'],
      zmid: 0,
      zmax: 2700,
      zmin: -2700,
      colorscale: [['0.0', 'rgb(175,0,0)'], ['0.5', 'rgb(255,255,255)'], ['1.0', 'rgb(0,175,0)']],
      showscale: false
      // colorbar: {x: 1}
    };

    var data1 = [trace1, trace2, trace3];

    var layout1 = {
      grid: {rows: 1, columns: 3, pattern: 'independent'},
      xaxis: {
        showline: true,
        linecolor: '#aaaaaa'
        // showgrid: false
      },
      xaxis2: {
        showline: true,
        linecolor: '#aaaaaa',
        showgrid: false
      },
      xaxis3: {
        showline: true,
        linecolor: '#aaaaaa'
        // showgrid: false
      },
      yaxis: {
        type: 'multicategory',
        showline: true,
        linecolor: '#cccccc',
        tickangle: 90,
        tickson: "boundaries",
        ticklen: 0,
        showdividers: true,
        dividercolor: '#cccccc',
        dividerwidth: 1,
        showgrid: false,
        automargin: true
      },
      yaxis2: {
        showticklabels: false,
        ticklen: 0,
        showline: true,
        linecolor: '#cccccc'
        // showgrid: false
      },
      yaxis3: {
        showticklabels: false,
        ticklen: 0,
        showline: true,
        linecolor: '#cccccc'
        // showgrid: false
      }

      // showlegend: false,
      // xaxis: {visible: true},
      // yaxis: {visible: true},
    };

    heatmapCl = document.getElementById('heatmaps');
    Plotly.newPlot('heatmaps', data1, layout1);

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
  hdata.append('region', region);

  // Send request
  request.send(hdata);
  return false;

}

function changePoint(e) {
  pointNumber = e.points[0].pointNumber
}

document.addEventListener('DOMContentLoaded', () => {

    var pointNumber = 4
    document.querySelector('#form').onsubmit = () => {

        // Initialize new request
        const request = new XMLHttpRequest();

        const bundles = document.querySelector('#bundles').value;
        const targetmargin = document.querySelector('#targetmargin').value;
        const minpayout = document.querySelector('#minpayout').value;
        const maxpayout = document.querySelector('#maxpayout').value;
        const kgperperson = document.querySelector('#kgperperson').value;
        const interest = document.querySelector('#interest').value;
        const deposit = document.querySelector('#deposit').value;

        request.open('POST', '/updategraphs');

        // Callback function for when request completes
        request.onload = () => {

            // Extract JSON data from request
            graphData = JSON.parse(request.responseText);

            var trace1 = {
              x: graphData['premsaspc_list'],
              y: graphData['clsr_list'],
              // text: pointText,
              mode: 'markers', // could use 'lines+markers'
              marker: {
                size: 15,
                opacity: 0.9,
                color: '#1776a6'
              },
              text: graphData['strikes'],
              hovertemplate:'<b>Strike Level:</b> %{text}kg/ha<extra></extra>',
              hoverinfo: '',
              line: {shape: 'spline', smoothing: 1.0}
            };

            var trace2 = {
              x: graphData['premsaspc_list'],
              y: graphData['clsr_list'],
              // text: pointText,
              mode: 'lines', // could use 'lines+markers'
              marker: {
                color: '#66aed1'
              },
              hoverinfo: '',
              line: {shape: 'spline', smoothing: 1.0}
            };

            var data = [trace2, trace1];

            var layout = {
              xaxis: {range: [0, 50.1]},
              yaxis: {range: [0, 100.5]},
              hovermode: 'closest',
              showlegend: false
            };

            scatterPlot = document.getElementById('result');
            Plotly.newPlot('result', data, layout);
            scatterPlot.on('plotly_click', changePoint);
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

// console.log(`result contents ${scatterPlot}`);


// scatterPlot.on(plotly_click, function(data){
//   console.log(data)
// })

// scatterPlot.on('plotly_click', function(data){
//   console.log(data.points[0].pointNumber)
//   console.log(bundles);
// })
