var childProcess = require('child_process');

module.exports.addJob = function addJob(jobParams, callback) {

  var callbackCalled = false;
  var child = childProcess.fork('./src/worker.js');

  child.on('message', function (msg) {
    if (!msg.hasOwnProperty('type')) {
      console.log('unknown message from child process');
      return;
    }

    if (msg.type === 'started') {
      if (!callbackCalled) {
        callbackCalled = true;
        callback();
      }
    }

    if (msg.type === 'finished') {
      child.kill();
    }

    if (msg.type === 'error') {
      if (!callbackCalled) {
        callbackCalled = true;
        callback(msg.error);
      }
    }
  });

  // start the child processing with a message
  child.send({
    type: 'start',
    jobParams: jobParams
  });
};
