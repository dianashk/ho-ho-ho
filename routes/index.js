var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var jobMgr = require('../src/jobManager');
var dataMgr = require('../src/dataManager');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',
    {
      title: 'Happy holiday geocoding!',
      intro: 'Santa noticed a good number of his favorite boys ' +
             'and girls have asked for a batch geocoder this year. ' +
             'So he has commissioned a few of his more peculiar ' +
             'develop-elves to whip something up to bring joy to all ' +
             'those odd boys and girls. Hey, the big guy doesn’t judge!',
      oops:  'Oops, the Naughty-or-Nice servers are down at the moment so we’ll have to take your word for it.',
      temptext: 'let\'s see your csv formatted list... err, file'
    });
});

// config the uploader
var options = {
  tmpDir: __dirname + '/../public/uploaded/tmp',
  publicDir: __dirname + '/../public/uploaded',
  uploadDir: __dirname + '/../public/uploaded/files',
  uploadUrl: '/uploaded/files/',
  maxPostSize: 11000000000, // 11 GB
  minFileSize: 1,
  maxFileSize: 10000000000, // 10 GB
  acceptFileTypes: /.+/i,
  accessControl: {
    allowOrigin: '*',
    allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
    allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
  },
  storage : {
    type : 'local'
  },
  nodeStatic: {
    cache: 3600 // seconds to cache served files
  }
};

var RESULTS_DIR = path.resolve(path.join(__dirname, '/../public/results'));
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR);
}

var uploader = require('blueimp-file-upload-expressjs')(options);


router.get('/ready', function(req, res) {
  if (!req.param('id')) {
    return res.status(404).send('No id specified');
  }
  var timestamp = req.param('id');
  var remotePath = timestamp + '/from-santa-with-love.csv';

  console.log('Check remote path exists: ', remotePath);

  dataMgr.exists(remotePath, function (err, found, publicUrl) {
    if (found) {
      console.log('Remote path exists: ', remotePath);
      res.status(200).send(publicUrl);
    }
    else {
      console.log('Remote path not found: ', remotePath);
      res.status(200).send('no');
    }
  });
});

router.post('/upload', function(req, res, next) {
  console.log(req.body);

  uploader.post(req, res, function (err, obj) {

    if (!obj.files) {
      res.status(201).send('No files were uploaded.');
      return;
    }

    var csvFile = obj.files[0];

    console.log(obj);

    if (!csvFile ||
        !csvFile.hasOwnProperty('fields') ||
        !csvFile.fields.hasOwnProperty('confirmNice') ||
        csvFile.fields.confirmNice !== 'on') {
      res.status(202).send('Need confirmation of niceness');
      return;
    }

    var timestamp = Date.now().toString();
    var jobDir = path.resolve(path.join(__dirname, '../public/results/', timestamp));
    var jobFile = path.join(jobDir, 'original.csv');
    var tempFile = path.join(csvFile.options.uploadDir, csvFile.name);
    fs.mkdirSync(jobDir);

    var copyStream = fs.createReadStream(tempFile).pipe(fs.createWriteStream(jobFile));
    copyStream.on('finish', function () {
      var jobParams = {
        resultsDir: jobDir,
        email: csvFile.fields.email,
        name: 'original.csv',
        timestamp: timestamp
      };
      jobMgr.addJob(jobParams, function (err) {
        if (err) {
          return res.status(500).send(err);
        }
        // delete temp file to keep the server clean
        fs.unlink(tempFile);
        res.send(timestamp);
      });
    });
  });
});

module.exports = router;
