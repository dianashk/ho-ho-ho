var s3 = require('s3');
var AWS = require('aws-sdk');
var aws_s3 = new AWS.S3();

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520 * 100, // this is the default (20 MB)
  multipartUploadSize: 15728640 * 100, // this is the default (15 MB)
  s3Options: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

function exists(remotePath, callback) {
  var params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: remotePath
  };

  aws_s3.headObject(params, function (err) {
    if (err) {
      // Handle no object on cloud here
      callback(null, false);
    }
    else {
      callback(null, true, getPublicUrl(remotePath));
    }
  });
}

function getPublicUrl(remotePath) {
  return s3.getPublicUrl(process.env.S3_BUCKET_NAME, remotePath);
}

function upload(localPath, remotePath, accessPublic, callback) {
  var params = {
    localFile: localPath,

    s3Params: {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: remotePath
    }
  };

  if (accessPublic) {
    params.s3Params.ACL = 'public-read';

  }

  var uploader = client.uploadFile(params);
  uploader.on('error', function(err) {
    console.error("unable to upload:", err.stack);
    callback(err);
  });
  uploader.on('end', function() {
    console.log("done uploading");
    callback(null, getPublicUrl(remotePath));
  });
}


module.exports = {
  exists: exists,
  upload: upload
};
