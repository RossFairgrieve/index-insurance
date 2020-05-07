
document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('#form').onsubmit = () => {

        // Initialize new request
        const request = new XMLHttpRequest();

        const bundles = document.querySelector('#bundles').value;
        const targetmargin = document.querySelector('#targetmargin').value;
        const minpayout = document.querySelector('#minpayout').value;

        request.open('POST', '/convert');

        // Callback function for when request completes
        request.onload = () => {

            // Extract JSON data from request
            graphData = JSON.parse(request.responseText);
            // document.querySelector('#result').innerHTML = graphData['strikes'][3];

            var pointText = [];
            var policyIds = graphData['policyids'];

            for (var i = 0; i < policyIds.length; i++) {
              pointText.push(`<a style="color:white;" href="/policies/${policyIds[i]}">CLICK HERE</a>`);
            }

            var trace1 = {
              x: graphData['premsaspc'],
              y: graphData['clsr'],
              text: pointText,
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


            Plotly.newPlot('result', data, layout);

        }

        // Add data to send with request
        const data = new FormData();
        data.append('bundles', bundles);
        data.append('targetmargin', targetmargin);
        data.append('minpayout', minpayout);

        // Send request
        request.send(data);
        return false;
    };

});
