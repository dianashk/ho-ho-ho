var HAS_ID_PARAM = false;

$(document).ready(function () {
  var params = getQueryParams(location.search);
  if (params && params.hasOwnProperty('id')) {
    JOB_ID = getQueryParams(location.search)['id'];
    HAS_ID_PARAM = true;
  }
  else {
    JOB_ID = '';
  }

  updateJobStatus();
});

function checkReady(id, callback) {
  $.get('/ready?id=' + id, function (data) {
    console.log('checked for ready:', data);
    if (data !== 'no') {
      document.getElementById('downloadLink').href = data;
      document.getElementById('downloadReady').style.display = 'block';
      $('html,body').animate({scrollTop: $('.downloadReady').offset().top}, 2000);
      callback(true);
    }
    else {
      callback(false);
    }
  });
}

function updateJobStatus() {
  if (JOB_ID && JOB_ID !== '') {
    // ask server if data is ready and if so scroll to the bottom with the gift
    // if not ready yet, scroll to the wait screen
    // if server says request for this didn't come through, show error
    if (HAS_ID_PARAM) {
      document.getElementById('intro').style.display = 'none';
      document.getElementById('upload').style.display = 'none';
    }

    checkReady(JOB_ID, function (res) {
      if (res === false) {
        // if still not ready, enable the wait screen and start checking on a regular basis
        document.getElementById('waitScreen').style.display = 'block';
        document.getElementById('downloadReady').style.display = 'none';
        $('html,body').animate({ scrollTop: $(".waitScreen").offset().top}, 0);
        var interval = setInterval(function () {
          checkReady(JOB_ID, function (res) {
            if (res === true) {
              clearInterval(interval);
            }
          });
        }, 60000/3); // every minute
      }
    });
  }
  else {
    document.getElementById('intro').style.display = 'block';
    document.getElementById('upload').style.display = 'block';
    //$('html,body').animate({ scrollTop: $(".intro").offset().top}, 2000);
  }
}

function getQueryParams(qs) {
  qs = qs.split('+').join(' ');

  var params = {},
      tokens,
      re = /[?&]?([^=]+)=([^&]*)/g;

  while (tokens = re.exec(qs)) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }

  return params;
}
