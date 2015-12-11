var path = require('path');
var csvgeocode = require('csvgeocode');
var fs = require('fs');

module.exports.addJob = function addJob(resultsDir, email, name) {

  email = email || 'unknown@email.com';

  var inputPath = path.resolve(path.join(resultsDir, name));
  var resultPath = path.resolve(path.join(resultsDir, 'from-santa-with-love.csv'));

  console.log('New Job:', inputPath, email, resultPath);

  //write to a file
  csvgeocode(
    inputPath,
    resultPath,
    {
      url: 'https://search.mapzen.com/v1/search?api_key=search-31dYkFs&text={{address}}',
      handler: function (body) {
        var results = JSON.parse(body);

        //success, return a lat/lng
        if (results.features && results.features.length > 0) {
          return {
            lat: results.features[0].geometry.coordinates[1],
            lng: results.features[0].geometry.coordinates[0]
          };
        }

        //failure, return a string
        return "NO MATCH";
      }
    }
  )
    .on('row', function (result, row) {
      console.log('row', result, row);
    })
    .on('complete', function(summary) {
    console.log('[FINISHED]', inputPath, email, resultPath, summary);
  })
};