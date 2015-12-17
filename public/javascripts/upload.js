function submitForm() {
  // first check if all data was provided
  // highlight missing stuff in red
  var email = document.getElementById('email').value;
  var file = document.getElementById('file').files[0];
  var confirm = document.getElementById('confirmNice').checked;

  console.log(email, file, confirm);

  document.getElementById('email').style.border = "1px solid darkgray";
  document.getElementById('inputfileLabel').style.border = "0px";
  document.getElementById('confirmNiceLabel').style.color = "black";

  var badData = false;

  if (!email || email === '' || email.indexOf('@') === -1) {
    badData = true;
    document.getElementById('email').style.borderColor = "red";
    document.getElementById('email').style.borderWidth = "5px";
    console.log('invalid email');
  }
  if (!file || file.type !== 'text/csv') {
    badData = true;
    document.getElementById('inputfileLabel').style.border = "5px solid red";
    console.log('bad file type');
  }
  if (!confirm) {
    badData = true;
    document.getElementById('confirmNiceLabel').style.color = "red";
    console.log('not nice');
  }

  if (badData) {
    return;
  }

  var form = document.forms.namedItem("uploadForm");
  var formData   = new FormData(form);

  var req = new XMLHttpRequest();
  req.open("POST", "/upload", true);
  req.onload = function (oEvent) {
    if (req.status === 200 && req.responseText) {
      JOB_ID = req.responseText;
      updateJobStatus();
    } else {
      alert('There was a problem: ' + req.responseText);
    }
  };

  req.send(formData);

  document.getElementById('waitScreen').style.display = 'block';
  $('html,body').animate({ scrollTop: $('.waitScreen').offset().top}, 2000);
}