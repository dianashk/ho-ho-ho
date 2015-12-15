var postmark = require('postmark');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var fs = require('fs');


// Example request
var clients = {};

console.log(process.env.HEROKU_EMAIL_TOKEN, process.env.ON_HEROKU);

if (process.env.HEROKU_EMAIL_TOKEN && process.env.HEROKU_EMAIL_SIGNATURE) {
  clients.heroku = new postmark.Client(process.env.HEROKU_EMAIL_TOKEN);
}

function emailResults(recipient, timestamp, callback) {
  var templateDir = path.join(__dirname, '../templates', 'resultsReady');

  var host = process.env.HOST_NAME || 'http://localhost:3000';
  var results = new EmailTemplate(templateDir);
  var data = {
    giftImage: host + '/images/gift.png',
    resultLink: host + '/results/' + timestamp + '/from-santa-with-love.csv'
  };

  results.render(data, function (err, emailBody) {
    if (err) {
      console.log(err);
      return callback();
    }

    if (clients.heroku) {
      herokuEmail(recipient, emailBody, callback);
    }
    else {
      console.log('unknown environment');
      fs.writeFileSync('./emailBody.html', emailBody.html);
      callback();
    }
  });
}

function herokuEmail(recipient, emailBody, callback) {

  var emailOpts = {
    'From': 'Mapzen Search Team <' + process.env.HEROKU_EMAIL_SIGNATURE + '>',
    'To': recipient,
    'Subject': 'Special batch delivery from the North Pole',
    'HtmlBody': emailBody.html
  };

  console.log('heroku: sending email to ', recipient);

  clients.heroku.sendEmail(emailOpts, function (err, info) {
    if (err) {
      console.error(JSON.stringify(err, null, 2));
    }
    else {
      console.log('Sent: ', JSON.stringify(info, null, 2));
    }
    callback();
  });
}

module.exports = emailResults;