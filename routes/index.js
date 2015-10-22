var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'USSD Express' });
});

router.get('/ussd-codes', function(req, res, next) {
  db.all("select * from ussd_codes order by created", function(err, rows) {
    res.send(JSON.stringify(rows));
  });
});

router.get('/sim-cards', function(req, res, next) {
  db.all("select * from sim_cards order by num", function(err, rows) {
    res.send(JSON.stringify(rows));
  });
});

module.exports = router;
