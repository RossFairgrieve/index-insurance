

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
      // y: [heatmapData['regions'], heatmapData['sitenames']],
      xaxis: 'x',
      yaxis:'y',
      xgap: 1,
      ygap: 1,
      zmax: 0,
      zmin: -4000,
      // zmin: minCl,
      colorscale: 'Hot',
      showscale: false
      // text: heatmapData['indexyields'],
      // hovertemplate:'Index-calculated yield: %{text} kg/ha',
      // colorbar: {x: -0.11, thickness: 25, tickangle: 270, tickfont: {size: 18}}
    };

    var trace2 = {
      z: heatmapData['cl_ins'], type: 'heatmap',
      x: heatmapData['columns'],
      // y: heatmapData['sitenames'],
      xaxis: 'x2',
      yaxis: 'y2',
      xgap: 1,
      ygap: 1,
      zmax: 0,
      zmin: -4000,
      colorscale: 'Hot',
      showscale: false
    };

    var trace3 = {
      z: heatmapData['improvement'], type: 'heatmap',
      x: heatmapData['columns'],
      // y: heatmapData['sitenames'],
      xaxis: 'x3',
      yaxis: 'y3',
      xgap: 1,
      ygap: 1,
      // y: heatmapData['index'],
      zmid: 0,
      zmax: 3500,
      zmin: -3500,
      showscale: false,
      colorscale: [['0.0', 'rgb(175,0,0)'], ['0.5', 'rgb(255,255,255)'], ['1.0', 'rgb(0,170,0)']]
      // showscale: false,
      // colorbar: {thickness: 25, tickangle: 270, tickfont: {size: 18}}
    };

    var data1 = [trace1, trace2, trace3];

    var layout1 = {
      grid: {rows: 1, columns: 3, pattern: 'independent'},
      xaxis: {
        showline: true,
        linecolor: '#999999',
        mirror: true
        // showgrid: false
      },
      xaxis2: {
        showline: true,
        linecolor: '#999999',
        mirror: true
      },
      xaxis3: {
        showline: true,
        linecolor: '#999999',
        mirror: true
      },
      yaxis: {
        // type: 'multicategory',
        // title: {
        //   text: 'Individual Farms',
        //   standoff: 0
        // },
        showline: true,
        linecolor: '#999999',
        mirror: true,
        tickangle: 90,
        tickson: "boundaries",
        ticklen: 0,
        // showdividers: false,
        // dividercolor: '#cccccc',
        // dividerwidth: 1,
        showticklabels: false,
        showgrid: false,
        automargin: true
      },
      yaxis2: {
        showticklabels: false,
        ticklen: 0,
        showline: true,
        linecolor: '#999999',
        mirror: true
        // showgrid: false
      },
      yaxis3: {
        showticklabels: false,
        ticklen: 0,
        showline: true,
        llinecolor: '#999999',
        mirror: true
        // showgrid: false
      },
      margin: {
        l: 1,
        r: 1,
        b: 25,
        t: 10,
        pad: 0
      },
      plot_bgcolor:'rgb(255, 255, 255)',
      paper_bgcolor:'transparent'

      // showlegend: false,
      // xaxis: {visible: true},
      // yaxis: {visible: true},
    };

    heatmapCl = document.getElementById('heatmaps');
    Plotly.newPlot('heatmaps', data1, layout1, {displayModeBar: false});

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

function scatterInfo(e) {

}

document.addEventListener('DOMContentLoaded', () => {

    // Initialize pointNumber to 4
    pointNumber=4;

    // Create blank scatterplot axes to show initially
    var layout = {
      xaxis: {range: [0, 50.1]},
      yaxis: {range: [0, 100.5]},
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
    Plotly.newPlot('scattergraph', [], layout, {displayModeBar: false});



    // Create blank heatmap axes to show initially
    const regionBlank = document.querySelector('#region').value;

    const requestBlank = new XMLHttpRequest();

    requestBlank.open('POST', '/blankheatmaps');

    requestBlank.onload = () => {
      heatmapDataBlank = JSON.parse(requestBlank.responseText);

      // Define and plot heatmaps
      var trace1 = {
        z: heatmapDataBlank['zeros'], type: 'heatmap',
        x: heatmapDataBlank['columns'],
        // y: [heatmapDataBlank['regions'], heatmapDataBlank['sitenames']],
        xaxis: 'x',
        yaxis:'y',
        xgap: 1,
        ygap: 1,
        zmax: 0,
        zmin: -4000,
        colorscale: 'Hot',
        hovertemplate:'',
        // colorbar: {x: -0.11, thickness: 25, tickangle: 270, tickfont: {size: 18}}
        showscale: false
      };

      var trace2 = {
        z: heatmapDataBlank['zeros'], type: 'heatmap',
        x: heatmapDataBlank['columns'],
        // y: heatmapDataBlank['sitenames'],
        xaxis: 'x2',
        yaxis: 'y2',
        xgap: 1,
        ygap: 1,
        zmax: 0,
        zmin: -4000,
        colorscale: 'Hot',
        showscale: false
      };

      var trace3 = {
        z: heatmapDataBlank['zeros'], type: 'heatmap',
        x: heatmapDataBlank['columns'],
        // y: heatmapDataBlank['sitenames'],
        xaxis: 'x3',
        yaxis: 'y3',
        xgap: 1,
        ygap: 1,
        // y: heatmapData['index'],
        zmid: 0,
        zmax: 3500,
        zmin: -3500,
        showscale: false,
        colorscale: [['0.0', 'rgb(175,0,0)'], ['0.5', 'rgb(255,255,255)'], ['1.0', 'rgb(0,170,0)']]
        // colorbar: {thickness: 25, tickangle: 270, tickfont: {size: 18}}
        // colorbar: {x: 1}
      };

      var data1 = [trace1, trace2, trace3];

      var layout1 = {
        grid: {rows: 1, columns: 3, pattern: 'independent'},
        xaxis: {
          showline: true,
          linecolor: '#999999',
          mirror: true
          // showgrid: false
        },
        xaxis2: {
          showline: true,
          linecolor: '#999999',
          mirror: true,
          showgrid: false
        },
        xaxis3: {
          showline: true,
          linecolor: '#999999',
          mirror: true,
          // showgrid: false
        },
        yaxis: {
          showline: true,
          linecolor: '#999999',
          // linewidth: 2,
          mirror: true,
          tickson: "boundaries",
          ticklen: 0,
          showticklabels: false,
          showgrid: false,
          automargin: true
          // title: {
          //   text: 'Individual Farms',
          //   standoff: 0
          // }

        },
        yaxis2: {
          showticklabels: false,
          ticklen: 0,
          showline: true,
          linecolor: '#999999',
          mirror: true
          // showgrid: false
        },
        yaxis3: {
          showticklabels: false,
          ticklen: 0,
          showline: true,
          linecolor: '#999999',
          mirror: true
          // showgrid: false
        },
        margin: {
          l: 1,
          r: 1,
          b: 25,
          t: 10,
          pad: 0
        },
        plot_bgcolor:'rgb(255, 255, 255)',
        paper_bgcolor:'transparent'

      };

      heatmapCl = document.getElementById('heatmaps');
      Plotly.newPlot('heatmaps', data1, layout1, {displayModeBar: false});

    };

    // Add data to send with request
    const dataBlank = new FormData();
    dataBlank.append('region', regionBlank);

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
            var trace1 = {
              x: graphData['premsaspc_list'],
              y: graphData['clsr_list'],
              // text: pointText,
              mode: 'lines+markers', // could use 'lines+markers'
              marker: {
                size: 15,
                opacity: 0.9,
                // color: '#ff6e40'
                color:'#224d73'
              },
              text: graphData['strikes'],
              hovertemplate:'<b>Strike Level:</b> %{text}kg/ha<extra></extra>',
              hoverinfo: '',
              line: {shape: 'spline', smoothing: 1.1}
            };

            var data = [trace1];

            var layout = {
              xaxis: {range: [0, 50.1]},
              yaxis: {range: [0, 100.5]},
              hovermode: 'closest',
              showlegend: false,
              margin: {
                l: 100,
                r: 100,
                b: 50,
                t: 50,
                pad: 0
              },
              plot_bgcolor:"rgba(255, 255, 255, 0.90)",
              paper_bgcolor:'transparent'
            };

            // Plot scatterplot with Plotly
            scatterPlot = document.getElementById('scattergraph');
            Plotly.newPlot('scattergraph', data, layout, {displayModeBar: false});
            scatterPlot.on('plotly_click', changePoint);
            scatterPlot.on('plotly_click', drawHeatmap);
            scatterPlot.on('plotly_click', scatterInfo);

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
