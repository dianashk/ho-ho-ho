var fs = require('fs');
var path = require('path');
var csvgeocode = require('csvgeocode');

function setup() {
  process.on('message', function(msg) {
    if (msg.hasOwnProperty('type') && msg.type === 'start') {
      doWork(msg.resultsDir, msg.email, msg.name);
    }
  });
}

function doWork(resultsDir, email, name) {

  var inputPath = path.resolve(path.join(resultsDir, name));
  var resultPath = path.resolve(path.join(resultsDir, 'from-santa-with-love.csv'));

  console.log('New Job:', inputPath, email, resultPath);
  process.send({type: 'started', resultPath: resultPath});

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
  .on('complete', function (summary) {
    console.log('[FINISHED]', inputPath, email, resultPath, summary);
    fs.writeFileSync(path.join(resultsDir,'ready'), 'come and get it');
    process.send({ type: 'finished', resultPath: resultPath, summary: summary });
  });
}


setup();