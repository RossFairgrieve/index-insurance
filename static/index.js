
function drawHeatmap(d) {
  const request = new XMLHttpRequest();

  const bundles = document.querySelector('#bundles').value;
  const targetmargin = document.querySelector('#targetmargin').value;
  const minpayout = document.querySelector('#minpayout').value;
  const kgperperson = document.querySelector('#kgperperson').value;
  const interest = document.querySelector('#interest').value;
  const deposit = document.querySelector('#deposit').value;

  var strikes = []
  for (var i = 0; i <= 6000; i += 500) {
    strikes.push(i);
  }

  strike = strikes[d.points[0].pointNumber];

  request.open('POST', '/heatmap');
  request.onload = function() {
    heatmapData = JSON.parse(request.responseText);

    // Find minimum value of cl_noins to use as heatmap scale minimum
    var minCl = [];
    for (var i = 0; i < heatmapData['cl_noins'].length; i++) {
      minCl.push(Math.min.apply(null, heatmapData['cl_noins'][i]));
    }
    minCl = Math.min.apply(null, minCl);

    // Define and plot heatmaps
    var trace1 = {
      z: heatmapData['cl_noins'], type: 'heatmap',
      x: heatmapData['columns'],
      y: heatmapData['index'],
      zmax: 0,
      zmin: minCl,
      colorscale: 'Hot'
    };

    var layout1 = {
      showlegend: true,
      xaxis: {visible: true},
      yaxis: {visible: true},
    };

    var data1 = [trace1];

    heatmapNo = document.getElementById('heatmap1');
    Plotly.newPlot('heatmap1', data1, layout1);

    var trace2 = {
      z: heatmapData['cl_ins'], type: 'heatmap',
      x: heatmapData['columns'],
      y: heatmapData['index'],
      zmax: 0,
      zmin: minCl,
      colorscale: 'Hot'
      // showscale: false
    };

    var layout2 = {
      showlegend: false,
      xaxis: {visible: true},
      yaxis: {visible: true},
    };

    var data2 = [trace2];

    heatmapWith = document.getElementById('heatmap2');
    Plotly.newPlot('heatmap2', data2, layout2);

    var trace3 = {
      z: heatmapData['improvement'], type: 'heatmap',
      x: heatmapData['columns'],
      y: heatmapData['index'],
      zmid: 0,
      zmax: 2700,
      zmin: -2700,
      colorscale: [['0.0', 'rgb(175,0,0)'], ['0.5', 'rgb(255,255,255)'], ['1.0', 'rgb(0,175,0)']]
    };

    var layout3 = {
      showlegend: true,
      xaxis: {visible: true},
      yaxis: {visible: true},
    };

    var data3 = [trace3];

    heatmapImp = document.getElementById('heatmap3');
    Plotly.newPlot('heatmap3', data3, layout3);


  };

  // Add data to send with request
  const hdata = new FormData();
  hdata.append('bundles', bundles);
  hdata.append('targetmargin', targetmargin);
  hdata.append('minpayout', minpayout);
  hdata.append('strike', strike);
  hdata.append('kgperperson', kgperperson);
  hdata.append('interest', interest);
  hdata.append('deposit', deposit);

  // Send request
  request.send(hdata);
  return false;

}

document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('#form').onsubmit = () => {

        // Initialize new request
        const request = new XMLHttpRequest();

        const bundles = document.querySelector('#bundles').value;
        const targetmargin = document.querySelector('#targetmargin').value;
        const minpayout = document.querySelector('#minpayout').value;
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
                size: 10,
                opacity: 0.75
              }
            };

            var data = [trace1];

            var layout = {
              xaxis: {range: [0, 50.1]},
              yaxis: {range: [0, 100.5]}
            };

            scatterPlot = document.getElementById('result');
            Plotly.newPlot('result', data, layout);
            scatterPlot.on('plotly_click', drawHeatmap);


        };

        // Add data to send with request
        const data = new FormData();
        data.append('bundles', bundles);
        data.append('targetmargin', targetmargin);
        data.append('minpayout', minpayout);
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
