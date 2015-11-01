var express = require('express');
var router = express.Router();
var fs = require("fs");
var xlsx = require('node-xlsx');
var multiparty = require('multiparty');
var Fiber = require('fibers');

var devicePort = 'COM5';
var comPort = 0;
var Modem = require('modem');
var modem = Modem.Modem();
var sp = require('serialport');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'USSD Express' });
});

router.get('/ussd-codes', function(req, res, next) {
  db.all("select * from ussd_codes order by created", function(err, rows) {
    res.send(JSON.stringify(rows));
  });
});

router.get('/sim-cards', function(req, res, next) {
  db.all("select sc.num, coalesce(sum(uc.val), 0) as in_val, coalesce((select sum(val) from ussd_log where num=sc.num and status=1), 00) as val from sim_cards sc " +
  "left join ussd_codes uc on uc.num=sc.num group by sc.num order by sc.num", function(err, rows) {
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

                    values.push(array);
                }
            }

            db.run("delete from sim_cards");
            var stmt = db.prepare("insert or ignore into sim_cards (num, created) VALUES (?, strftime('%s'))");

            for (var i = 0; i < values.length; i++) {
                stmt.run(values[i][0]);
            }
            stmt.finalize(function() {
                res.send({status: 'ok', text: 'Success'});
                assignSimcard();
            });

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

                    values.push(array);
                }
            }

            db.run("delete from ussd_codes");
            var stmt = db.prepare("insert or ignore into ussd_codes (code, val, created) VALUES (?, ?, strftime('%s'))");

            for (var i = 0; i < values.length; i++) {
                stmt.run(values[i][0], values[i][1]);
            }

            stmt.finalize(function() {
                res.send({status: 'ok', text: 'Success'});
                assignSimcard();
            });
        });
    });

    form.parse(req);
});

router.get('/assign', function(req, res, next) {
    assignSimcard();
    res.send('Scheduled...');
});

function assignSimcard() {Fiber(function() {
    var dailyLimit = 1000;
    var monthlyLimit = 30000;
    var fiber = Fiber.current;

    db.all("select count(*) as cnt from ussd_codes where num is null", function (err, row) {
        if(err) return fiber.throwInto(err);
        fiber.run(row[0].cnt);
    })
    var uncnt = Fiber.yield();
    if(uncnt < 1) return;

    fiber = Fiber.current;
    db.all("select * from (select sc.num, " +
        "coalesce((select sum(val) from ussd_log where num=sc.num and created>=strftime('%s', 'now', 'start of day')), 0) as dval, " +
        "coalesce((select sum(val) from ussd_log where num=sc.num and created>=coalesce((select min(created) from ussd_log " +
        "where created>=strftime('%s', 'now', 'start of month')), strftime('%s', 'now', 'start of month'))), 0) as mval " +
        "from sim_cards sc) " +
        "where dval<" + dailyLimit + " and mval<" + monthlyLimit + " order by num",
        function(err, rows) {
            if(err) return fiber.throwInto(err);
            fiber.run(rows);
        }
    );
    var simcards = Fiber.yield();
    if(simcards.length == 0) return;

    var updateStmt = db.prepare("update ussd_codes set num=? where code=?");
    db.each("select code, val from ussd_codes where num is null", function (err, row) {
        for(var i = 0; i < simcards.length; i++) {
            if(simcards[i].dval + row.val <= dailyLimit && simcards[i].mval + row.val <= monthlyLimit) {
                simcards[i].dval += row.val;
                simcards[i].mval += row.val;
                updateStmt.run(simcards[i].num, row.code);
                return;
            }
        }
    }, function() {  updateStmt.finalize(); });
}).run();}


router.get('/processing-code', function(req, res, next) {
    if (!modem.isOpened) {
        comPort = 0;
        openPort(function() {
            processing();
            console.log('======OK');
            res.send('Modem is connected');
        },
        function() {
            console.log('======ERROR');
            modem.close();
            res.send('Modem not found');
        });

    }
    else res.send('Modem is connected');
});

function openPort (cb, errorcb) {
    var device,
        port;

    if (comPort > 20) {
        errorcb();
        return;
    }

    comPort += 1;

    if (devicePort) device = devicePort;
    else device = "COM"+comPort;

    port = new sp.SerialPort(device, {
        parser: sp.parsers.raw
    });

    port.on('open', function() {
        port.close();
    });

    port.on('close', function() {
        port.close();
        connectModem(device, cb, errorcb);
    });

    port.on('error', function() {
        if (device == devicePort) devicePort = null;
        openPort(cb, errorcb);
    });
}

function connectModem(device, cb, errorcb) {
    var session = Modem.Ussd_Session();
    var isDetected = false;
    var modemClose = false;

    modem.open(device, function() {
        modem.ussd_pdu = false;

        session.execute = function() {
            session.query('*102#', function() {
                isDetected = true;
                console.log('Модем обнаружен, порт ' + device);
                cb();
            });

            session.on('close', function() {
               if (!isDetected) openPort(cb, errorcb);
            });
        }

        session.modem = modem;
        session.start();
    });
}

function usc2toString (str) {
    var parts = str.match(/.{4}/g);
    var result = '';
    for(var i = 0; i < parts.length; i++) result += String.fromCharCode('0x' + parts[i]);
    return result;
}

function processing() {Fiber(function() {
    var fiber = Fiber.current;
    db.all("select code, num, val from ussd_codes where num is not null and code <> 0 and val <> 0 and status = 0", function (err, rows) {
        if(err) return fiber.throwInto(err);
        fiber.run(rows);
    })
    var codes = Fiber.yield();

    console.log(codes);
    for(var i = 0; i < codes.length; i++) {
        console.log("====");
        fiber = Fiber.current;
        var session = Modem.Ussd_Session();
        session.execute = function () {
            var code = "*104*"+codes[i].code+"*"+codes[i].num+"#";
            session.query(code, function () {
                var response = usc2toString(arguments['1']);
                db.run("insert into ussd_log (created, code, num, val, response, status) values (strftime('%s'), ?, ?, ?, ?, ?)",
                    codes[i].code,
                    codes[i].num,
                    codes[i].val,
                    response,
                    1
                );
                db.run("update ussd_codes set status=1 where code=?", codes[i].code);
                console.log("Запрос: "+code, "Ответ: " + response);
            });
            session.on('close', function(err, cb) {
                if(err) return fiber.throwInto(err);
                fiber.run();
            });
        }
        session.modem = modem;
        session.start();
        Fiber.yield();
    }
}).run();}

module.exports = router;