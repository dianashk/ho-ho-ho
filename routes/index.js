var express = require('express');
var router = express.Router();

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
      temptext: 'let\'s see your csv formatted list... err, file'
    });
});

module.exports = router;
