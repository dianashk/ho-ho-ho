var fs = require('fs');
var rmdir = require('rimraf');
var path = require('path');
var csvgeocode = require('csvgeocode');
var emailer = require('./emailer');
var dataMgr = require('./dataManager');

function setup() {
  process.on('message', function(msg) {
    if (msg.hasOwnProperty('type') && msg.type === 'start') {
      doWork(msg.jobParams);
    }
  });
}

function doWork(jobParams) {

  var jobPath = path.resolve(path.join(jobParams.resultsDir, 'job.json'));

  // create job file and upload it to S3 for record keeping
  fs.writeFileSync(jobPath, JSON.stringify(jobParams));
  dataMgr.upload(jobPath, 'jobs/' + jobParams.timestamp + '.json', false, function () {

    // delete uploaded job file
    fs.unlinkSync(jobPath);

    // start the work
    work(jobParams);
  });
}

function work(jobParams) {
  var inputPath = path.resolve(path.join(jobParams.resultsDir, jobParams.name));
  var resultPath = path.resolve(path.join(jobParams.resultsDir, 'from-santa-with-love.csv'));

  console.log('New Job:', inputPath, jobParams.email, resultPath);

  // send message that work has begun
  process.send({type: 'started', resultPath: resultPath});

  var geocodeParams = {
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
  };

  //write to a file
  csvgeocode(inputPath, resultPath, geocodeParams)
    .on('row', function (result, row) {
      console.log('row', result, row);
    })
    .on('complete', function (summary) {
      console.log('[FINISHED]', inputPath, jobParams.email, resultPath, summary);
      setTimeout(
        function () {
          // upload file to S3
          dataMgr.upload(
            resultPath,
            jobParams.timestamp + '/from-santa-with-love.csv',
            true, //public access
            onUploadComplete.bind(null, jobParams)
          );
        },
        1000);
    });
}

function onUploadComplete(jobParams, err, publicUrl) {
  // delete local dir after upload is done
  rmdir.sync(jobParams.resultsDir, {});

  // email user about results
  emailer(jobParams.email, jobParams.timestamp, publicUrl, function () {

    // send message to kill fork
    process.send({type: 'finished', publicUrl: publicUrl});
  });
}


setup();