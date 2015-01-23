var request = require('request');

request(location.href + 'add', {
    json: true
}, function(err, res) {
    L.mapbox.accessToken = 'pk.eyJ1IjoidG1jdyIsImEiOiJIZmRUQjRBIn0.lRARalfaGHnPdRcc-7QZYQ';
    // Create a map in the div #map
    var map = L.mapbox.map('map', 'tmcw.l12c66f2');

    request(location.href + 'tin', { json: true }, function(err, res, body) {
        L.geoJson(body, {
            style: function(feature) {
                return {
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    color: '#eee',
                    fillColor: feature.properties.fill
                };
            }
        }).addTo(map);
    });

    request(location.href + 'points', { json: true }, function(err, res, body) {
        L.mapbox.featureLayer(body).addTo(map).eachLayer(function(l) {
            l.bindPopup('<h2>' + l.feature.properties.speed.toFixed(2) + ' kb/s</h2>');
        });
    });

    if (err) console.error(err);
});
