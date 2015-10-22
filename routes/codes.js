var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  db.all("select * from ussd_codes order by created", function(err, rows) {
    res.send(JSON.stringify(rows));
  });
});

module.exports = router;
