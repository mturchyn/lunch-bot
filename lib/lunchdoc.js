var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

var LunchDoc = function Constructor(googleDocKey, googleApiConfig) {
    this.doc = new GoogleSpreadsheet(googleDocKey);
    this.googleApiConfig = googleApiConfig;
    var that = this;
    async.series([
        function setAuth(step) {
            that.doc.useServiceAccountAuth(that.googleApiConfig, step);
        },
        function getInfoAndWorksheets(step) {
            that.doc.getInfo(function (err, info) {
                that.sheet = info.worksheets[0];
                step();
            });
        }]);
};

LunchDoc.prototype.getMenu = function (cb) {
    var that = this;
    this.sheet.getCells({
        'min-row': 3,
        'max-row': 4,
        'return-empty': true
    }, function (err, cells) {
        var menuCell = cells[7];
        var info = [];
        info.push('Меню на сегодня:');
        var menuValue = menuCell.value;
        info.push(menuValue);
        cb(info.join("\n\n"));
    });
};

LunchDoc.prototype.getPrice = function (cb) {
    var that = this;
    this.sheet.getCells({
        'min-row': 3,
        'max-row': 4,
        'return-empty': true
    }, function (err, cells) {
        var priceCell = cells[6];
        cb(parseInt(priceCell.value));
    });
};

LunchDoc.prototype.order2 = function (username, order, comment, cb) {
    var that = this;
    this.getPrice(function (price) {
        that.sheet.getCells({
            'min-row': 1,
            'max-row': 26,
            'min-col': 1,
            'max-col': 5,
            'return-empty': true
        }, function (err, cells) {
            for (var i = 0; i < cells.length; i += 5) {
                var cell = cells[i];
                var userWasFound = false;
                if (cell.value == username) {
                    userWasFound = true;
                    var orderCell = cells[i + 1];
                    orderCell.value = order;

                    var commentCell = cells[i + 2];
                    commentCell.value = comment;

                    var depositCell = cells[i + 4];
                    var depositCellValue = parseInt(depositCell.value);
                    depositCell.value = depositCellValue - price;

                    that.doc.bulkUpdateCells([
                        orderCell, commentCell, depositCell
                    ], function() {
                        cb(null, {success: true, price: price});
                    });


                    break;
                }
            }

            if (!userWasFound) {
                cb(null, {success: false});
            }
        });
    });


};

LunchDoc.prototype.order = function (username, order, comment, cb) {
    var that = this;
    that.sheet.getCells({
        'min-row': 1,
        'max-row': 40,
        'min-col': 1,
        'max-col': 7,
        'return-empty': true
    }, function (err, cells) {
        var price = parseInt(cells[20].value);

        for (var i = 0; i < cells.length; i += 7) {
            var cell = cells[i];
            var userWasFound = false;
            if (cell.value == username) {
                userWasFound = true;
                var orderCell = cells[i + 1];
                orderCell.value = order;

                var commentCell = cells[i + 2];
                commentCell.value = comment;

                var depositCell = cells[i + 4];
                var depositCellValue = parseInt(depositCell.value);
                depositCell.value = depositCellValue - price;

                that.sheet.bulkUpdateCells([
                    orderCell, commentCell, depositCell
                ], function() {
                    cb(null, {success: true, price: price});
                });


                break;
            }
        }

        if (!userWasFound) {
            cb(null, {success: false});
        }
    });


};

LunchDoc.prototype.findUser = function (username, cb) {
    this.sheet.getCells({
        'min-row': 1,
        'max-row': 26,
        'min-col': 1,
        'max-col': 1,
        'return-empty': true
    }, function (err, cells) {
        var userWasFound = false;
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            if (cell.value == username) {
                userWasFound = true;
                break;
            }
        }
        cb(userWasFound);
    });
};


module.exports = LunchDoc;