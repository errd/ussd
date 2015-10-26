var express = require('express');
var router = express.Router();
var fs = require("fs");
var xlsx = require('node-xlsx');
var multiparty = require('multiparty');

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

router.post('/upload-ussd', function(req, res, next) {
   /* var form = new multiparty.Form();
    var path = './files/ussd';
    var uploadFile = {uploadPath: '', type: '', size: 0};

    form.on('error', function(err){
        if(fs.existsSync(path)) fs.unlinkSync(path);
    });

    form.on('close', function() {
        res.send({status: 'ok', text: 'Success'});
    });

    form.on('part', function(part) {
        uploadFile.size = part.byteCount;
        uploadFile.type = part.headers['content-type'];
        uploadFile.path = path;

        var out = fs.createWriteStream(uploadFile.path);
        part.pipe(out);
    });

    form.parse(req);*/
    var path = './files/phones.xlsx';
    var obj = xlsx.parse(path);
    res.send({status: 'ok', text: 'Success', obj: obj});

});

router.post('/upload-phones', function(req, res, next) {
    var form = new multiparty.Form();
    var path = './files/phones.xlsx';
    var uploadFile = {uploadPath: '', type: '', size: 0};

    form.on('error', function(err){
        if(fs.existsSync(path)) fs.unlinkSync(path);
    });

    form.on('close', function() {
        res.send({status: 'ok', text: 'Success'});
    });

    form.on('part', function(part) {
        uploadFile.size = part.byteCount;
        uploadFile.type = part.headers['content-type'];
        uploadFile.path = path;

        var out = fs.createWriteStream(uploadFile.path);
        part.pipe(out);
        out.on('close', function () {
            console.log('All done!');
            var obj = xlsx.parse(path);
        });
    });

    form.parse(req);
});

module.exports = router;
