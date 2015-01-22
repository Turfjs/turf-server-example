var transfer = require('transfer-rate');
var express = require('express');
var app = express();
var ss = require('simple-statistics');
var turf = require('turf');
var request = require('request');

var rate = transfer({ output: false });

app.set('port', (process.env.PORT || 3000));
app.enable('trust proxy');
var points = { type: 'FeatureCollection', features: [] };

app.get('/add', function(req, res) {
  var ip = (req.ip === '127.0.0.1') ? '199.188.195.78' : req.ip;
  if (req.ips) ip = req.ips[0];
  request('https://www.mapbox.com/api/Location/' + ip, {
      json: true
  }, function(err, place) {
    if (!err &&
        place.body &&
        place.body.lat !== undefined &&
        place.body.lat !== 0) {
      var random_long_string = '';
      for (var i = 0; i < 100; i++) random_long_string += Math.random();
      var start = process.hrtime();
      res.send({
          random: random_long_string,
          self: place.body
      });
      rate(req, start);
      points.features.push({
          type: 'Feature',
          geometry: {
              type: 'Point',
              coordinates: [
                  place.body.lon,
                  place.body.lat
              ]
          },
          properties: {
              speed: parseFloat(req.transferRate)
          }
      });
      if (points.features.length > 1000) points.features.shift();
    } else {
      console.log(err, place);
      res.end('done');
    }
  });
});

app.get('/points', function(req, res) {
    res.send(points);
});

app.get('/tin', function(req, res) {
    var tin = turf.tin(points, 'speed');
    var values = [];
    tin.features.forEach(function(f) {
        f.properties.total = f.properties.a + f.properties.b + f.properties.c;
        values.push(f.properties.total);
    });
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
