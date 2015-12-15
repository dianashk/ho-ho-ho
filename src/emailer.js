var postmark = require('postmark');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');


// Example request
var clients = {};

console.log(process.env.HEROKU_EMAIL_TOKEN, process.env.ON_HEROKU);

if (process.env.HEROKU_EMAIL_TOKEN && process.env.HEROKU_EMAIL_SIGNATURE) {
  clients.heroku = new postmark.Client(process.env.HEROKU_EMAIL_TOKEN);
}

function emailResults(recipient, resultsPath) {
  if (clients.heroku) {
    herokuEmail(recipient, resultsPath);
  }
  else {
    console.log('unknown environment');
  }
}

function herokuEmail(recipient, timestamp, callback) {

  var templateDir = path.join(__dirname, 'templates', 'resultsReady');

  var results = new EmailTemplate(templateDir);
  var data = {
    giftImage: process.env.HOST_NAME + '/images/gift.png',
    resultLink: process.env.HOST_NAME + '/results/' + timestamp + '/from-santa-with-love.csv'
  };

  results.render(data, function (err, emailBody) {
    var emailOpts = {
      'From': 'Mapzen Search Team <' + process.env.HEROKU_EMAIL_SIGNATURE + '>',
      'To': recipient,
      'Subject': 'Special batch delivery from the North Pole',
      'HtmlBody': emailBody.html,
      'TextBody': emailBody.text
    };

    console.log('sending email to ', recipient, timestamp);

    clients.heroku.sendEmail(emailOpts, function (err, info) {
      if (err) {
        console.error(JSON.stringify(err, null, 2));
      }
      else {
        console.log('Sent: ', JSON.stringify(info, null, 2));
      }
      callback();
    });
  });
}

module.exports = emailResults;