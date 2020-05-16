// Initialize clicked scatter point and heatmap cell to null
var pointNumber = null;
var cellNumber = null;

// Define base trace for scatterplots
var traceScatBlank = {
  mode: 'lines+markers', // could use 'lines+markers'
  marker: {
    size: 15,
    opacity: 0.9,
    // color: '#ff6e40'
    color:'#224d73'
  },
  hovertemplate:'%{text}<extra></extra>',
  hoverinfo: '',
  line: {shape: 'spline', smoothing: 1.3}
};


// Define layout for scatterplots
var layoutScat = {
  title: {
    text: '<span style="font-weight: bold; text-transform: uppercase;">Overall insurance performance<br>at various strike levels</span>',
    font: {
      size: 14,
      color: '#444444'
    },
    y: 0.94
  },
  xaxis: {
    range: [0, 50.1],
    title: {
      text: '<span style="font-weight: bold;">Mean insurance cost as % of harvest value</span>',
      font: {
        size: 14,
        color: '#444444'
      },
      standoff: 0
    },
    tickfont: {
      size: 14
    }
  },
  yaxis: {
    range: [0, 100.5],
    title: {
      text: '<span style="font-weight: bold;">Reduction in total<br>critical shortfall (%)</span>',
      font: {
        size: 14,
        color: '#444444'
      },
      standoff: 0
    },
    tickfont: {
      size: 14
    }
  },
  hovermode: 'closest',
  showlegend: false,
  margin: {
    l: 80,
    r: 80,
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
  zmin: -1900,
  colorscale: 'Hot',
  hovertemplate:'',
  colorbar: {
    thickness: 15,
    tickangle: 270,
    tickfont: {
      size: 12
    }
  },
  hoverinfo: '',
  hoverlabel: {
    bgcolor: '#EEEEEE',
    bordercolor: '#CCCCCC',
    font: {
      color: '#666666'
    }
  }
};

var layoutHeatmapBase = {
  xaxis: {
    // type: 'category',
    showline: true,
    linecolor: '#999999',
    mirror: true,
    title: {
      text: '<b>Year</b>',
      standoff: 0
    }
  },

  yaxis: {
    // type: 'category',
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
    b: 65,
    t: 65,
    pad: 0,
  },
  plot_bgcolor:'rgb(255, 255, 255)',
  paper_bgcolor:'transparent',
  title: {
    // text: '<b>Critical shortfall<br>No insurance (kg)</b>',
    font: {
      size: 12
    },
    x: 0.45
  }
};


// -------------------------------------


function drawHeatmap(d=null) {

  if (d != null) {

    pointNumber = d.points[0].pointNumber

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

    var strike = strikes[pointNumber];

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
      traceImp.colorscale = [['0.0', 'rgb(125,0,0)'], ['0.25', 'rgb(255,125,125)'], ['0.5', 'rgb(255,255,255)'], ['0.75', 'rgb(125,255,125)'], ['1.0', 'rgb(0,125,0)']];
      traceImp.zmax = 1800;
      traceImp.zmid = 0;
      traceImp.zmin = -1800;

      var layoutNoins = JSON.parse(JSON.stringify(layoutHeatmapBase));
      var layoutIns = JSON.parse(JSON.stringify(layoutHeatmapBase));
      var layoutImp = JSON.parse(JSON.stringify(layoutHeatmapBase));

      layoutNoins.title.text = '<span style="font-weight: bold;">CRITICAL SHORTFALL<br>NO INSURANCE (kg/ha)</span>';
      layoutIns.title.text = '<span style="font-weight: bold;">CRITICAL SHORTFALL<br>WITH INSURANCE (kg/ha)</span>';
      layoutImp.title.text = '<span style="font-weight: bold;">CHANGE<br>WITH INSURANCE (kg/ha)</span>';

      var heatmap1text = [];
      for (var i = 0; i < heatmapData['sitenames'].length; i++) {
        heatmap1text.push([])
        for (var j = 0; j < heatmapData['columns'].length; j++) {
          if (heatmapData['cl_noins'][i][j] < 0) {
            heatmap1text[i].push(`<b>Site:</b> ${heatmapData['sitenames'][i]}<br><b>Year:</b> ${heatmapData['columns'][j]}<br><b>Crit. shortfall:</b> <span style="font-weight: bold; color: red;">${-heatmapData['cl_noins'][i][j].toFixed(0)} kg</span>`);
          } else {
            heatmap1text[i].push(`<b>Site:</b> ${heatmapData['sitenames'][i]}<br><b>Year:</b> ${heatmapData['columns'][j]}<br><b>Crit. shortfall:</b> <span style="font-weight: bold;">${-heatmapData['cl_noins'][i][j].toFixed(0)} kg</span>`);
          }
        }
      }

      var heatmap2text = [];
      for (var i = 0; i < heatmapData['sitenames'].length; i++) {
        heatmap2text.push([])
        for (var j = 0; j < heatmapData['columns'].length; j++) {
          if (heatmapData['cl_ins'][i][j] < 0) {
            heatmap2text[i].push(`<b>Site:</b> ${heatmapData['sitenames'][i]}<br><b>Year:</b> ${heatmapData['columns'][j]}<br><b>Crit. shortfall:</b> <span style="font-weight: bold; color: red;">${-heatmapData['cl_ins'][i][j].toFixed(0)} kg</span>`);
          } else {
            heatmap2text[i].push(`<b>Site:</b> ${heatmapData['sitenames'][i]}<br><b>Year:</b> ${heatmapData['columns'][j]}<br><b>Crit. shortfall:</b> <span style="font-weight: bold;">${-heatmapData['cl_ins'][i][j].toFixed(0)} kg</span>`);
          }
        }
      }

      var heatmap3text = [];
      for (var i = 0; i < heatmapData['sitenames'].length; i++) {
        heatmap3text.push([])
        for (var j = 0; j < heatmapData['columns'].length; j++) {
          if (heatmapData['improvement'][i][j] > 0) {
            heatmap3text[i].push(`<b>Site:</b> ${heatmapData['sitenames'][i]}<br><b>Year:</b> ${heatmapData['columns'][j]}<br><b>Change:</b> <span style="font-weight: bold; color: limegreen;">${heatmapData['improvement'][i][j].toFixed(0)} kg</span>`);
          } else if (heatmapData['improvement'][i][j] < 0) {
            heatmap3text[i].push(`<b>Site:</b> ${heatmapData['sitenames'][i]}<br><b>Year:</b> ${heatmapData['columns'][j]}<br><b>Change:</b> <span style="font-weight: bold; color: red;">${heatmapData['improvement'][i][j].toFixed(0)} kg</span>`);
          } else {
            heatmap3text[i].push(`<b>Site:</b> ${heatmapData['sitenames'][i]}<br><b>Year:</b> ${heatmapData['columns'][j]}<br><b>Change: ${heatmapData['improvement'][i][j].toFixed(0)} kg</b>`);
          }
        }
      }

      traceCritNoins.text = heatmap1text;
      traceCritIns.text = heatmap2text;
      traceImp.text = heatmap3text;

      traceCritNoins.hovertemplate = '%{text}<extra></extra>';
      traceCritIns.hovertemplate = '%{text}<extra></extra>';
      traceImp.hovertemplate = '%{text}<extra></extra>';

      Plotly.newPlot('heatmap1', [traceCritNoins], layoutNoins, {displayModeBar: false});
      Plotly.newPlot('heatmap2', [traceCritIns], layoutIns, {displayModeBar: false});
      Plotly.newPlot('heatmap3', [traceImp], layoutImp, {displayModeBar: false});

      document.getElementById('heatmap1').on('plotly_click', changeCell);
      // document.getElementById('heatmap1').on('plotly_click', annotateHeatmaps);
      document.getElementById('heatmap1').on('plotly_click', heatmapInfo);

      document.getElementById('heatmap2').on('plotly_click', changeCell);
      document.getElementById('heatmap2').on('plotly_click', heatmapInfo);

      document.getElementById('heatmap3').on('plotly_click', changeCell);
      document.getElementById('heatmap3').on('plotly_click', heatmapInfo);

      if (cellNumber != null) {
        cellDict = {'points':[{pointNumber: [cellNumber[0], cellNumber[1]]}]};
        // console.log(`About to update heatmap info for cell ${cellNumber}`)
        heatmapInfo(cellDict);
      }

      // Link hover for all heatmaps
      document.getElementById('heatmap1').on('plotly_hover', function (eventdata){
        var points = eventdata.points[0],
        pointNum = points.pointNumber;

        Plotly.Fx.hover('heatmap2',[{ curveNumber:0, pointNumber:pointNum }]);
        Plotly.Fx.hover('heatmap3',[{ curveNumber:0, pointNumber:pointNum }]);
      });

      document.getElementById('heatmap2').on('plotly_hover', function (eventdata){
        var points = eventdata.points[0],
        pointNum = points.pointNumber;

        Plotly.Fx.hover('heatmap1',[{ curveNumber:0, pointNumber:pointNum }]);
        Plotly.Fx.hover('heatmap3',[{ curveNumber:0, pointNumber:pointNum }]);
      });

      document.getElementById('heatmap3').on('plotly_hover', function (eventdata){
        var points = eventdata.points[0],
        pointNum = points.pointNumber;

        Plotly.Fx.hover('heatmap1',[{ curveNumber:0, pointNumber:pointNum }]);
        Plotly.Fx.hover('heatmap2',[{ curveNumber:0, pointNumber:pointNum }]);
      });



      // Link unhover for all heatmaps
      document.getElementById('heatmap1').on('plotly_unhover', function (eventdata){
        var points = eventdata.points[0],
        pointNum = points.pointNumber;

        Plotly.Fx.unhover('heatmap2',[{ curveNumber:0, pointNumber:pointNum }]);
        Plotly.Fx.unhover('heatmap3',[{ curveNumber:0, pointNumber:pointNum }]);
      });

      document.getElementById('heatmap2').on('plotly_unhover', function (eventdata){
        var points = eventdata.points[0],
        pointNum = points.pointNumber;

        Plotly.Fx.unhover('heatmap1',[{ curveNumber:0, pointNumber:pointNum }]);
        Plotly.Fx.unhover('heatmap3',[{ curveNumber:0, pointNumber:pointNum }]);
      });

      document.getElementById('heatmap3').on('plotly_unhover', function (eventdata){
        var points = eventdata.points[0],
        pointNum = points.pointNumber;

        Plotly.Fx.unhover('heatmap1',[{ curveNumber:0, pointNumber:pointNum }]);
        Plotly.Fx.unhover('heatmap2',[{ curveNumber:0, pointNumber:pointNum }]);
      });

    }


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
  };
};


// -------------------------------------


function changePoint(e) {
  pointNumber = e.points[0].pointNumber
}


// -------------------------------------


function changeCell(e) {
  cellNumber = [e.points[0].pointNumber[0], e.points[0].pointNumber[1]]
}


// -------------------------------------

function changeColor(e) {
  if (e != null) {

    var colors = [];
    var update = {'marker':{color: colors, size: 15}};

    // Create array of colors that is yellow for the clicked point
    // and blue for everything else
    for (var i = 0; i < graphData['strikes'].length; i++) {
      if (i == e.points[0].pointNumber) {
        colors.push('#ffc13b');
      } else {
        colors.push('#224d73');
      }
    }

    // Update graph with array of colors
    Plotly.restyle('scattergraph', update);
  }
}


// -------------------------------------


function annotateHeatmaps(e) {
  if (e != null) {

    console.log("Running annotateHeatmaps")
    var colors = [];
    var update = {'annotations': []};

    // Update graph with array of colors
    Plotly.relayout('heatmap1', update);

    update = {
      annotations: [{
        text: '',
        x: e.points[0].pointNumber[1],
        y: e.points[0].pointNumber[0],
        xref: 'x',
        yref: 'y',
        bgcolor: 'rgba(0,0,255,1)',
        width: 5,
        height: 3,
        showarrow: false
      }]
    }

    Plotly.relayout('heatmap1', update);

  }
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

  if (e != null) {

    cellNumber = [e.points[0].pointNumber[0], e.points[0].pointNumber[1]];

    document.getElementById('site-year').innerHTML = heatmapData['sitenames'][e.points[0].pointNumber[0]] + ' - ' + heatmapData['columns'][e.points[0].pointNumber[1]];
    document.getElementById('index-yield').innerHTML = heatmapData['indexyields'][cellNumber[0]][cellNumber[1]].toString() + ' kg/ha';
    document.getElementById('real-yield').innerHTML = heatmapData['realyields'][cellNumber[0]][cellNumber[1]].toString() + ' kg/ha';
    document.getElementById('crit-loss-noins').innerHTML = -(Math.round(heatmapData['cl_noins'][cellNumber[0]][cellNumber[1]])).toString() + ' kg';
    document.getElementById('crit-loss-ins').innerHTML = -(Math.round(heatmapData['cl_ins'][cellNumber[0]][cellNumber[1]])).toString() + ' kg';
    var sign = '';
    var startHtml = '';
    var endHtml = '';
    if (heatmapData['improvement'][cellNumber[0]][cellNumber[1]] > 0) {
      sign = '+';
      startHtml = '<span style="color: limegreen">';
      endHtml = '</span>';
    } else if (heatmapData['improvement'][cellNumber[0]][cellNumber[1]] < 0) {
      startHtml = '<span style="color: red">';
      endHtml = '</span>';
    }
    document.getElementById('improvement').innerHTML = startHtml + sign + (Math.round(heatmapData['improvement'][cellNumber[0]][cellNumber[1]]).toString()) + ' kg' + endHtml;
  };
};


// -------------------------------------


document.addEventListener('DOMContentLoaded', () => {

    //Prevent videos form playing on when modal window closed
    $('.modal').on('hide.bs.modal', function() {
      var memory = $(this).html()
      $(this).html(memory);
    })


    // Add blank scatter graph
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
      traceImpBlank.colorscale = [['0.0', 'rgb(125,0,0)'], ['0.25', 'rgb(255,125,125)'], ['0.5', 'rgb(255,255,255)'], ['0.75', 'rgb(125,255,125)'], ['1.0', 'rgb(0,125,0)']];
      traceImpBlank.zmax = 1800;
      traceImpBlank.zmid = 0;
      traceImpBlank.zmin = -1800;

      var layout1 = JSON.parse(JSON.stringify(layoutHeatmapBase));
      var layout2 = JSON.parse(JSON.stringify(layoutHeatmapBase));
      var layout3 = JSON.parse(JSON.stringify(layoutHeatmapBase));

      layout1.title.text = '<span style="font-weight: bold;">CRITICAL SHORTFALL<br>NO INSURANCE (kg/ha)</span>';
      layout2.title.text = '<span style="font-weight: bold;">CRITICAL SHORTFALL<br>WITH INSURANCE (kg/ha)</span>';
      layout3.title.text = '<span style="font-weight: bold;">CHANGE<br>WITH INSURANCE (kg/ha)</span>';

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

        var scattertext = [];
        var hoversuffix = 'kg/ha'
        for (var i = 0; i < graphData['strikes'].length; i++) {
          scattertext.push(`<b>Payout theshold:</b> ${graphData['strikes'][i]} ${hoversuffix}<br><b>Insurer margin:</b> ${graphData['realised_margin'][i].toFixed(1)} %`);
        }
        traceScat.text = scattertext;

        // Plot scatterplot with Plotly
        Plotly.newPlot('scattergraph', [traceScat], layoutScat, {displayModeBar: false});
        scatterPlot = document.getElementById('scattergraph');

        scatterPlot.on('plotly_click', function(e) {
          changePoint(e);
          changeColor(e);
          scatterInfo(e);
          drawHeatmap(e);
        });

        if (pointNumber != null) {
          pointDict = {'points':[{pointNumber: pointNumber}]}
          changeColor(pointDict);
          drawHeatmap(pointDict);
        }

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
