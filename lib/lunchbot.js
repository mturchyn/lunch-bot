var SlackBot = require('slackbots');
var util = require('util');
var fs = require('fs');
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var doc = new GoogleSpreadsheet('1ncAerEaagxGQMvnie34IhLwdde19XKwnjPGyZKvr_mk');
var SQLite = require('sqlite3').verbose();

// create a bot
var Lunchbot = function Constructor(settings) {
    this.settings = settings;
    this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'data', 'lunchbot.db');
    this.googleApiConfig = settings.googleApiConfig;

    this.db = null;
};

util.inherits(Lunchbot, SlackBot);

Lunchbot.prototype.run = function () {
    Lunchbot.super_.call(this, this.settings);

    this._initDb();

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
    // TODO add listeners on adding and removing
};

Lunchbot.prototype._initDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
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
                that._postMessage(message, info.join("\n\n"));
                step();
            });
        }
    ]);
};

Lunchbot.prototype._onMyNameIs = function (message) {
    var self = this;
    self.db.get('SELECT username_in_doc FROM user_mapping where slackid = ? LIMIT 1', [message.user], function (err, record) {
       console.dir(error);
    });
    self.db.run('INSERT INTO user_mapping(slackid, username_in_doc) VALUES(?, ?)', message.user, message.text);

};

Lunchbot.prototype._onOrder = function (message) {
    var userId = message.user;
    var self = this;
    self.db.get('SELECT username_in_doc FROM user_mapping where slackid = \'123\' LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var channel = self._getChannelById(originalMessage.channel);
        self.postMessageToChannel(channel.name, record.joke, {as_user: true});
        self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    });


};

Lunchbot.prototype._postMessage = function (slackMessage, text, params) {
    this.postMessage(slackMessage.channel, text, params || {});
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