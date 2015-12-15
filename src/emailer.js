
// Require
var postmark = require('postmark');

// Example request
var clients = {};

console.log(process.env.HEROKU_EMAIL_TOKEN);

if (process.env.HEROKU_EMAIL_TOKEN) {
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

function herokuEmail(recipient, resultsPath) {
  var emailHtml = '<H1>Results are ready</H1><a href="' + resultsPath + '">get them here...</a>';

  var emailOpts = {
    'From': '"Mapzen Search Team" <noreply@pelias.mapzen.com>',
    'To': recipient,
    'Subject': 'Batch Mapzen Search: Special delivery from the North Pole',
    'HtmlBody': emailHtml
  };

  console.log('sending email');
  
  clients.heroku.sendEmail(emailOpts, function (err, info) {
    if( err ){
      console.error( JSON.stringify( err, null, 2 ) );
    }
    else {
      console.log( 'Sent: ', JSON.stringify( info, null, 2 ) );
    }
  });
}

module.exports = emailResults;