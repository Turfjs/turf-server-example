var transfer = require('transfer-rate'),
    express = require('express'),
    app = express(),
    ss = require('simple-statistics'),
    turf = require('turf'),
    request = require('request');

// The transfer-rate module creates a request wrapper that measures bandwidth
var rate = transfer({ output: false, reponse: false });

// Dynamically set the port that this application runs on so that Heroku
// can properly wrap the way that it connects to the outside network
app.set('port', (process.env.PORT || 3000));

// Set expressjs to trust the proxy so that we can get the external
// client IP address in the req.ips variable
app.enable('trust proxy');

// Create the GeoJSON FeatureCollection of points in which we'll store
// the results of the bandwidth tests.
var points = { type: 'FeatureCollection', features: [] };

// This is the endpoint through which new computers add themselves to the
// map by downloading a test payload
app.get('/add', function(req, res) {
  var ip = (req.ip === '127.0.0.1') ? '199.188.195.78' : req.ip;

  // get the external client IP - this variable is filled because
  // we enabled 'trust proxy' earlier.
  if (req.ips && req.ips.length) ip = req.ips[0];

  // Use Mapbox for figuring out user locations: in production use,
  // you would want to use MaxMind or another geoip library directly.
  request('https://www.mapbox.com/api/Location/' + ip, {
      json: true
  }, function(err, place) {
    // Check that Mapbox was able to locate the IP address at all
    // before trying to add it to the map.
    if (!err &&
        place.body &&
        place.body.lat !== undefined &&
        place.body.lat !== 0) {
      var i;
      var random_long_string = '';
      for (i = 0; i < 100; i++) random_long_string += Math.random();
      var start = process.hrtime();
      var self = {
          type: 'Feature',
          geometry: {
              type: 'Point',
              coordinates: [place.body.lon, place.body.lat]
          },
          properties: { }
      };
      res.send({
          random: random_long_string,
          self: self
      });
      rate(req, start);
      // avoid duplicating results that land in the same exact latitude
      // and longitude position.
      for (i = 0; i < points.features.length; i++) {
          if (points.features[i].geometry.coordinates[0] == place.body.lon &&
              points.features[i].geometry.coordinates[1] == place.body.lat) {
              // avoid duplicates
              return;
          }
      }
      // req.transferRate contains the transfer rate in KB/s
      self.properties.speed = parseFloat(req.transferRate);
      points.features.push(self);
      if (points.features.length > 1000) points.features.shift();
    } else {
      console.log(err, place);
      res.end('done');
    }
  });
});

// Get the non-triangulated points. We calculate marker colors here
// to keep the front end code simple.
app.get('/points', function(req, res) {
    var pts = JSON.parse(JSON.stringify(points));
    var values = [];
    pts.features.forEach(function(f) {
        values.push(f.properties.speed);
    });
    var min = ss.min(values), max = ss.max(values);
    pts.features.forEach(function(f) {
        var s = (f.properties.speed - min) / (max - min);
        f.properties['marker-size'] = 'small';
        f.properties['marker-color'] =
            (s > 0.8 ? '#d7301f' :
             (s > 0.5 ? '#fc8d59' :
              (s > 0.3 ? '#fdcc8a' :
               '#fef0d9')));
    });
    res.send(pts);
});

app.get('/tin', function(req, res) {
    var tin = turf.tin(points, 'speed');
    var values = [];
    tin.features.forEach(function(f) {
        f.properties.total = f.properties.a + f.properties.b + f.properties.c;
        values.push(f.properties.total);
    });
    // use simple-statistics to calculate minimum and maximum values
    // for a quick scale
    var min = ss.min(values), max = ss.max(values);
    tin.features.forEach(function(f) {
        f.properties.scaled = (f.properties.total - min) / (max - min);
        var s = f.properties.scaled;
        f.properties.fill =
            (s > 0.8 ? '#d7301f' :
             (s > 0.5 ? '#fc8d59' :
              (s > 0.3 ? '#fdcc8a' :
               '#fef0d9')));
    });
    res.send(tin);
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('running %s %s', host, port);
});
