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

router.post('/upload-phones', function(req, res, next) {
    var form = new multiparty.Form();
    var path = './files/phones.xlsx';
    var uploadFile = {uploadPath: '', type: '', size: 0};

    form.on('error', function(err){
        if(fs.existsSync(path)) fs.unlinkSync(path);
    });

   /* form.on('close', function() {
        res.send({status: 'ok', text: 'Success'});
    });*/

    form.on('part', function(part) {
        uploadFile.size = part.byteCount;
        uploadFile.type = part.headers['content-type'];
        uploadFile.path = path;

        var out = fs.createWriteStream(uploadFile.path);
        part.pipe(out);
        out.on('close', function () {
            var obj = xlsx.parse(path);
            var dataValues;
            var data;
            var values = [];

            for(var i = 0; i < obj.length; i++) {
                data = obj[i].data;

                if (data.length<1) continue;

                for(var j = 0; j < data.length; j++) {
                    dataValues = data[j];

                    if (dataValues.length<1) continue;

                    var array = [];

                    if (dataValues[0]) array.push(dataValues[0]);
                    else array.push('0');

                    if (dataValues[1]) array.push(dataValues[1]);
                    else array.push(0);

                    array.push(new Date().getTime());
                    array.push(0);
                    values.push(array);
                }
            }

            db.run("delete from sim_cards");
            var stmt = db.prepare("insert or ignore into sim_cards (num, val, created, active, updated) VALUES (?, ?, ?, ?, ?)");

            for (var i = 0; i < values.length; i++) {
                stmt.run(values[i][0], values[i][1], values[i][2], values[i][3]);
            }
            stmt.finalize();
            res.send({status: 'ok', text: 'Success'});
        });
    });

    form.parse(req);
});

router.post('/upload-ussd', function(req, res, next) {
    var form = new multiparty.Form();
    var path = './files/ussd.xlsx';
    var uploadFile = {uploadPath: '', type: '', size: 0};

    form.on('error', function(err){
        if(fs.existsSync(path)) fs.unlinkSync(path);
        res.send({status: 'bad', text: 'Success'});
    });

    /*form.on('close', function() {
        res.send({status: 'ok', text: 'Success'});
    });*/

    form.on('part', function(part) {
        uploadFile.size = part.byteCount;
        uploadFile.type = part.headers['content-type'];
        uploadFile.path = path;

        var out = fs.createWriteStream(uploadFile.path);
        part.pipe(out);

        out.on('close', function () {
            var obj = xlsx.parse(path);
            var dataValues;
            var data;
            var values = [];

            for(var i = 0; i < obj.length; i++) {
                data = obj[i].data;
                if (data.length<1) continue;
                for(var j = 0; j < data.length; j++) {
                    dataValues = data[j];
                    if (dataValues.length<1) continue;
                    var array = [];

                    if (dataValues[0]) array.push(dataValues[0]);
                    else array.push('0');

                    if (dataValues[1]) array.push(dataValues[1]);
                    else array.push(0);

                    array.push(new Date().getTime());
                    array.push(0);
                    values.push(array);
                }
            }

            db.run("delete from ussd_codes");
            var stmt = db.prepare("insert or ignore into ussd_codes (code, val, created, updated) VALUES (?, ?, ?, ?)");

            for (var i = 0; i < values.length; i++) {
                stmt.run(values[i][0], values[i][1], values[i][2], values[i][3]);
            }

            stmt.finalize();
            res.send({status: 'ok', text: 'Success'});
        });
    });

    form.parse(req);
});

module.exports = router;
