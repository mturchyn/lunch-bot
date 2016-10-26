var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

var LunchDoc = function Constructor(googleDocKey, googleApiConfig) {
    this.doc = new GoogleSpreadsheet(googleDocKey);
    this.googleApiConfig = googleApiConfig;

};

LunchDoc.prototype.getMenu = function (cb) {
    var that = this;
    var sheet;
    async.series([
        function setAuth(step) {
            that.doc.useServiceAccountAuth(that.googleApiConfig, step);
        },
        function getInfoAndWorksheets(step) {
            that.doc.getInfo(function(err, info) {
                sheet = info.worksheets[0];
                step();
            });
        },
        function workingWithCells(step) {
            sheet.getCells({
                'min-row': 25,
                'max-row': 26,
                'return-empty': true
            }, function(err, cells) {
                var menuCell = cells[1];
                var info = [];
                info.push('Меню на сегодня:');
                var menuValue = menuCell.value;
                info.push(menuValue);
                cb(info.join("\n\n"));
                step();
            });
        }
    ]);
};

LunchDoc.prototype.order = function (username, order, comment, cb) {
    var that = this;
    var sheet;
    async.series([
        function setAuth(step) {
            that.doc.useServiceAccountAuth(that.googleApiConfig, step);
        },
        function getInfoAndWorksheets(step) {
            that.doc.getInfo(function(err, info) {
                sheet = info.worksheets[0];
                step();
            });
        },
        function workingWithCells(step) {
            sheet.getCells({
                'min-row': 1,
                'max-row': 26,
                'min-col': 1,
                'max-col': 3,
                'return-empty': true
            }, function(err, cells) {
                for (var i = 0; i < cells.length; i+=3) {
                    var cell = cells[i];
                    if (cell.value == username) {
                        var orderCell = cells[i + 1];
                        const commentCell = cells[i + 2];
                        orderCell.value = order;
                        orderCell.save(function() {
                            commentCell.value = comment;
                            commentCell.save(function() {
                                cb(true);
                            });

                        });
                        break;
                    }
                }
                cb(false);
                step();
            });
        }
    ]);

};

LunchDoc.prototype.findUser = function (username, cb) {
    var that = this;
    var sheet;
    async.series([
        function setAuth(step) {
            that.doc.useServiceAccountAuth(that.googleApiConfig, step);
        },
        function getInfoAndWorksheets(step) {
            that.doc.getInfo(function(err, info) {
                sheet = info.worksheets[0];
                step();
            });
        },
        function workingWithCells(step) {
            sheet.getCells({
                'min-row': 1,
                'max-row': 26,
                'min-col': 1,
                'max-col': 1,
                'return-empty': true
            }, function(err, cells) {
                for (var i = 0; i < cells.length; i++) {
                    var cell = cells[i];
                    if (cell.value == username) {
                        cb(true);
                        break;
                    }
                }
                cb(false);
                step();
            });
        }
    ]);

};


module.exports = LunchDoc;