var request = require('request');

// Add the user to the map and get their current
// location
request(location.href + 'add', { json: true }, function(err, res, body) {
    L.mapbox.accessToken = 'pk.eyJ1IjoidG1jdyIsImEiOiJIZmRUQjRBIn0.lRARalfaGHnPdRcc-7QZYQ';
    // Create a map in the div #map
    var map = L.mapbox.map('map', 'tmcw.l12c66f2', {
        maxZoom: 6,
        scrollWheelZoom: false
    });

    // Zoom into the current user
    var ownpoint = L.geoJson(body.self, {
            pointToLayer: function(geojson, latlng) {
                return L.circleMarker(latlng, {
                    radius: 30,
                    fillColor: '#000',
                    fillOpacity: 0.1,
                    color: '#000',
                    weight: 2
                });
            }
        })
        .addTo(map);

    map.fitBounds(ownpoint.getBounds());

    // get the triangulated version of the current data
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

    // get the raw data
    request(location.href + 'points', { json: true }, function(err, res, body) {
        L.mapbox.featureLayer(body).addTo(map).eachLayer(function(l) {
            l.bindPopup('<h2>' + l.feature.properties.speed.toFixed(2) + ' kb/s</h2>');
        });
    });

    if (err) console.error(err);
});
