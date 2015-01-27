var xhr = require('xhr');

if (window.location.search) {
    var overlay = document.getElementById('overlay');
    overlay.parentNode.removeChild(overlay);
}

var basePath = window.location.href.split('?')[0].split('#')[0];

// Add the user to the map and get their current
// location
xhr({ uri: basePath + 'add', json: true }, function(err, res, body) {
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

    // get the triangulated version of the current data
    xhr({ uri: basePath + 'tin', json: true }, function(err, res, body) {
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
    xhr({ uri: basePath + 'points', json: true }, function(err, res, body) {
        L.mapbox.featureLayer(body).addTo(map);
    });

    if (err) console.error(err);
});
