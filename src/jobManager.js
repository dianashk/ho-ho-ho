var childProcess = require('child_process');

module.exports.addJob = function addJob(jobParams, callback) {

  var child = childProcess.fork('./src/worker.js');

  child.on('message', function (msg) {
    if (!msg.hasOwnProperty('type')) {
      console.log('unknown message from child process');
      return;
    }
    if (msg.hasOwnProperty('type') && msg.type === 'started') {
      callback();
    }

    if (msg.type === 'finished') {
      child.kill();
    }
  });

  // start the child processing with a message
  child.send({
    type: 'start',
    jobParams: jobParams
  });
};
