var fs = require('fs');
var rmdir = require('rimraf');
var async = require('async');
var path = require('path');
var csvgeocode = require('csvgeocode');
var emailer = require('./emailer');
var dataMgr = require('./dataManager');
var csvparse = require('csv-parse');
var _ = require('lodash');

function setup() {
  process.on('message', function(msg) {
    if (msg.hasOwnProperty('type') && msg.type === 'start') {
      doWork(msg.jobParams);
    }
  });
}


function doWork(jobParams) {

  async.waterfall(
    [
      checkValidInput.bind(null, jobParams),
      uploadJobInfoToS3,
      uploadInputToS3,
      runGeocoderBatch,
      uploadResultsToS3,
      sendEmail
    ],
    function (err) {
      console.log('Job Done', err);

      // send message to kill fork
      if (err) {
        // check if input was valid because that would indicate that we already returned a 200 to the sender
        // so the only thing to do now in case of error is to upload an error file instead of results

        if (jobParams.validInput) {

          var resultPath = path.resolve(path.join(jobParams.resultsDir, 'from-santa-with-love.csv'));
          fs.writeFileSync(resultPath + '.err', 'You get coal, because something went wrong. Bummer!\n' + JSON.stringify(err));

          dataMgr.upload(
            resultPath + '.err',
            jobParams.timestamp + '/from-santa-with-love.csv',
            true, //public access
            function (err, publicUrl) {
              sendEmail(publicUrl, jobParams, function () {
                process.send({type: 'error', error: err});
              });
            });
        }
        else {
          process.send({type: 'error', error: err});
        }
      }
      else {
        process.send({type: 'finished'});
      }
    }
  );
}


function checkValidInput(jobParams, callback) {
  var inputPath = path.resolve(path.join(jobParams.resultsDir, jobParams.name));

  fs.readFile(inputPath, function (err, data) {
    csvparse(data, {}, function (err, output) {

      if (err) {
        console.log(err);
        return callback(err.message);
      }

      if (!output || output.length < 2 || output[0].length < 1) {
        return callback('The file is empty.');
      }

      console.log('rows in file:', output.length);

      if (output.length > 10000) {
        return callback('Too many rows. Try a set with less than 10,000!');
      }

      var header = output[0];

      var addressColumn = _.filter(header, function (column) {
        if (column.trim().toLowerCase() === 'address') {
          return true;
        }
      });

      if (!addressColumn || addressColumn.length === 0) {
        return callback('No "address" column header!');
      }

      if (addressColumn[0] !== 'address' && addressColumn[0].trim() === 'address') {
        return callback('Unexpected leading and trailing whitespace in header row.');
      }

      jobParams.validInput = true;
      callback(null, addressColumn[0], jobParams);
    });
  });
}

function uploadJobInfoToS3(columnName, jobParams, callback) {
  var jobPath = path.resolve(path.join(jobParams.resultsDir, 'job.json'));

  // create job file and upload it to S3 for record keeping
  fs.writeFileSync(jobPath, JSON.stringify(jobParams));
  dataMgr.upload(jobPath, 'jobs/' + jobParams.timestamp + '.json', false, function () {

    // delete uploaded job file
    fs.unlinkSync(jobPath);

    // start the work
    callback(null, columnName, jobParams);
  });
}

function uploadInputToS3(columnName, jobParams, callback) {
  var inputPath = path.resolve(path.join(jobParams.resultsDir, jobParams.name));

  // create job file and upload it to S3 for record keeping
  dataMgr.upload(inputPath, jobParams.timestamp + '/original.csv', false, function () {
    // start the work
    callback(null, columnName, jobParams);
  });
}

function runGeocoderBatch(columnName, jobParams, callback) {
  var inputPath = path.resolve(path.join(jobParams.resultsDir, jobParams.name));
  var resultPath = path.resolve(path.join(jobParams.resultsDir, 'from-santa-with-love.csv'));

  console.log('New Job:', inputPath, jobParams.email, resultPath);

  // send message that work has begun
  process.send({type: 'started', resultPath: resultPath});

  var geocodeParams = {
    url: 'https://search.mapzen.com/v1/search?api_key=search-31dYkFs&text={{' + (columnName || 'address') + '}}',
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
    .on('row', function (err, row) {
      console.log('gecocode result: ', err, jobParams.email, jobParams.timestamp, row);
    })
    .on('error', function (err) {
      console.log('geocoding error: ', err);
      callback(err);
    })
    .on('complete', function (summary) {
      console.log('[FINISHED]', inputPath, jobParams.email, resultPath, summary);
      callback(null, resultPath, jobParams);
    });
}

function uploadResultsToS3(resultPath, jobParams, callback) {
  setTimeout(
    function () {
      // upload file to S3
      dataMgr.upload(
        resultPath,
        jobParams.timestamp + '/from-santa-with-love.csv',
        true, //public access
        function (err, publicUrl) {
          callback(err, publicUrl, jobParams);
        }
      );
    },
    1000);
}

function sendEmail(publicUrl, jobParams, callback) {
  // delete local dir after upload is done
  rmdir.sync(jobParams.resultsDir, {});

  // email user about results
  emailer(jobParams.email, jobParams.timestamp, publicUrl, callback);
}


setup();