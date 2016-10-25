var SlackBot = require('slackbots');
var util = require('util');
var fs = require('fs');
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var doc = new GoogleSpreadsheet('1ncAerEaagxGQMvnie34IhLwdde19XKwnjPGyZKvr_mk');
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

// create a bot
var Lunchbot = function Constructor(settings) {
    this.settings = settings;
    this.googleApiConfig = settings.googleApiConfig;
    this.mongodbUrl = settings.mongodbUrl;

    this.db = null;
};

util.inherits(Lunchbot, SlackBot);

Lunchbot.prototype.run = function () {
    Lunchbot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
    // TODO add listeners on adding and removing
};

Lunchbot.prototype._onStart = function () {
    var that = this;
    this.memberChannelsAndGroups = {};

    this.getChannels().then(function(channelsWrapper) {
        channelsWrapper.channels.filter(function(channel) {
            return channel.is_member;
        }).forEach(function(channel) {
           that.memberChannelsAndGroups[channel.id] = channel.name;
        });
    });

    this.getGroups().then(function(groupsWrapper) {
        groupsWrapper.groups.forEach(function(group) {
            that.memberChannelsAndGroups[group.id] = group.name;
        });
    });

    this.getUsers().then(function(usersResponse) {
        that.users = {};
        usersResponse.members.forEach(function(user) {
            that.users[user.id] = user;
        });
    });
};

Lunchbot.prototype._onMessage = function (message) {
    if (message.type === 'message' && this.memberChannelsAndGroups[message.channel]) {
        this._onTextMessage(message);
    }
};

Lunchbot.prototype._onTextMessage = function (message) {
    console.log("Received message: " + JSON.stringify(message));
    if (message.text == 'menu') {
        this._onMenu(message);
    } else if (message.text.startsWith('mynameis ')) {
        this._onMyNameIs(message);
    } else if (message.text.startsWith('order ')) {
        this._onOrder(message);
    }
};

Lunchbot.prototype._onMenu = function (message) {
    var that = this;
    var sheet;
    async.series([
        function setAuth(step) {
            doc.useServiceAccountAuth(that.googleApiConfig, step);
        },
        function getInfoAndWorksheets(step) {
            doc.getInfo(function(err, info) {
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
                that._postMessage(message.channel, info.join("\n\n"));
                step();
            });
        }
    ]);
};

Lunchbot.prototype._onMyNameIs = function (message) {
    var docName = message.text.substring('mynameis '.length);
    var that = this;
    MongoClient.connect(this.mongodbUrl, function(err, db) {
        var users = db.collection("users");
        users.updateOne({slackid:message.user}, {slackid:message.user, doc_username: docName}, {upsert:true}, function(err, db) {
            console.log("Mapped " + message.user + " with " + docName);
        });
        db.close();
        var successMessage = "Спасибо, <@" + that.users[message.user].name + ">, Ваше имя в гуглдоке было изменено на " + docName;
        that._postMessage(message.channel, successMessage);
    });
};

Lunchbot.prototype._onOrder = function (message) {
    var that = this;
    MongoClient.connect(this.mongodbUrl, function(err, db) {
        var users = db.collection("users");
        users.findOne({slackid:message.user}, function(err, document) {
            if (document) {
                var docUsername = document.doc_username;
                var orderValue = message.text.substring('order '.length);
                async.series([
                    function setAuth(step) {
                        doc.useServiceAccountAuth(that.googleApiConfig, step);
                    },
                    function getInfoAndWorksheets(step) {
                        doc.getInfo(function(err, info) {
                            sheet = info.worksheets[0];
                            step();
                        });
                    },
                    function workingWithCells(step) {
                        sheet.getCells({
                            'min-row': 1,
                            'max-row': 26,
                            'min-col': 1,
                            'max-col': 2,
                            'return-empty': true
                        }, function(err, cells) {
                            for (var i = 0; i < cells.length; i+=2) {
                                var cell = cells[i];
                                if (cell.value == docUsername) {
                                    var orderCell = cells[i + 1];
                                    orderCell.value = orderValue;
                                    orderCell.save(function() {
                                        that._postMessage(message.channel, 'Готово! ' + that.users[message.user].name + ', Ваш заказ №' + orderValue);
                                    });
                                    break;
                                }
                            }
                            step();
                        });
                    }
                ]);
            } else {
                var noUserFoundMsg = "Пожалуйста зарегестрируйтесь с помощью команды mynameis <Ваше имя в гугл доке>. Пример:\nmynameis Артем Рысюк";
                that._postMessage(message.channel, noUserFoundMsg);
            }
        });
        db.close();
    });


};

Lunchbot.prototype._postMessage = function (channelId, text, params) {
    this.postMessage(channelId, text, params || {});
};

Lunchbot.prototype.isChannelMessage = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C';
};

Lunchbot.prototype.isGroupMessage = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'G';
};


module.exports = Lunchbot;