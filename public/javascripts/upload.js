function submitForm() {
  var form = document.forms.namedItem("uploadForm");
  var formData   = new FormData(form);

  var req = new XMLHttpRequest();
  req.open("POST", "/upload", true);
  req.onload = function (oEvent) {
    if (req.status === 200 && req.responseText) {
      document.getElementById('downloadLink').href = req.responseText;
      document.getElementById('downloadReady').style.display = 'block';
      $('html,body').animate({ scrollTop: $('.downloadReady').offset().top}, 2000);
    } else {
      alert('There was a problem: ' + req.responseText);
    }
  };

  req.send(formData);

  document.getElementById('waitScreen').style.display = 'block';
  $('html,body').animate({ scrollTop: $('.waitScreen').offset().top}, 2000);
}