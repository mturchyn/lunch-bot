var SlackBot = require('slackbots');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;
var Jokes = require('./jokes');
var jokes = new Jokes();
var Lunchdoc = require('./lunchdoc');
var winston = require('winston');
var vkMenuFetcherModule = require('./vk-menu-fetcher');
var vkMenuFetcher = new vkMenuFetcherModule({});
var format = require('string-format');
format.extend(String.prototype);

// create a bot
var Lunchbot = function Constructor(settings) {
    this.settings = settings;
    this.mongodbUrl = settings.mongodbUrl;
    this.lunchdoc = new Lunchdoc(settings.googleDocKey, settings.googleApiConfig);

    this.db = null;
};

util.inherits(Lunchbot, SlackBot);

Lunchbot.prototype.run = function () {
    winston.info('Starting Lunchbot application');
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
    /*vkMenuFetcher.scrapeMenu(function(err, menuOptions) {
        if (!err) {
            console.dir(menuOptions);
        }
    }); */
};

Lunchbot.prototype._onMessage = function (message) {
    if (message.type === 'message' && this.memberChannelsAndGroups[message.channel]) {
        this._onTextMessage(message);
    }
};

Lunchbot.prototype._onTextMessage = function (message) {
    winston.debug("Received message: " + JSON.stringify(message));
    if (message.text == 'help') {
        this._onHelp(message);
    } else if (message.text == 'menu') {
        this._onMenu(message);
    } else if (message.text.startsWith('mynameis ')) {
        this._onMyNameIs(message);
    } else if (message.text.startsWith('order ')) {
        this._onOrder(message);
    }
};

Lunchbot.prototype._onHelp = function (message) {
    var info = [];
    info.push("menu - выводит меню на сегодня");
    info.push("mynameis <имя в гуглдоке> - добавляет имя пользователя для дальнейшего использования. Пример:\nmynameis Артем Рысюк");
    info.push("order <номер заказа> [optional -c <коммент>] - заказать блюда под определенным номером. Вычитает сумму из депозита Примеры:\n" +
        "order 1\n" +
        "order 1 -c двойной майонез\n" +
        "order 1 суп 2");
    this._postMessage(message.channel, info.join("\n\n"));
};

Lunchbot.prototype._onMenu = function (message) {
    var that = this;
    this.lunchdoc.getMenu(function(menu) {
        that._postMessage(message.channel, menu);
    });
};

Lunchbot.prototype._onMyNameIs = function (message) {
    var docName = message.text.substring('mynameis '.length);
    var that = this;
    this.lunchdoc.findUser(docName, function(result) {
       if (result) {
           MongoClient.connect(that.mongodbUrl, function(err, db) {
               var users = db.collection("users");
               users.updateOne({slackid:message.user}, {slackid:message.user, doc_username: docName}, {upsert:true}, function(err, db) {
                   console.log("Mapped " + message.user + " with " + docName);
               });
               db.close();
               var successMessage = "Спасибо, <@{}>, Ваше имя было сохранено как {}".format(that.users[message.user].name, docName);
               that._postMessage(message.channel, successMessage);
           });
       } else {
           var errorMessage = "<@{}>, не могу найти имя {} в документе".format(that.users[message.user].name, docName);
           that._postMessage(message.channel, errorMessage);
       }
    });

};

Lunchbot.prototype._onOrder = function (message) {
    var that = this;

    var order = message.text.substring('order '.length);
    var comment = '';
    var indexOfComment = order.indexOf("-c");
    if (indexOfComment != -1) {
        comment = order.substring(indexOfComment + 2).trim();
        order = order.substring(0, indexOfComment).trim();
    }

    MongoClient.connect(this.mongodbUrl, function(err, db) {
        var users = db.collection("users");
        users.findOne({slackid:message.user}, function(err, document) {
            if (document) {
                var docUsername = document.doc_username;

                that.lunchdoc.order(docUsername, order, comment, function(err, result) {
                    if (err) {
                        that._postMessage(message.channel, "Some error occurred");
                        throw err;
                    } else {
                        if (result.success) {
                            var joke = jokes.getNextOne();
                            var text = '{} <@{}>, Ваш заказ принят. C Вашего счета было списано {} рублей'
                                .format(joke, that.users[message.user].name,  result.price);
                            that._postMessage(message.channel, text);
                        } else {
                            var errorMessage = '<@{}>, возможно Вы неправильно сохранили свое имя. Пользователь {} не был найден в документе'
                                .format(that.users[message.user].name, docUsername);
                            that._postMessage(message.channel, errorMessage);
                        }
                    }

                });
            } else {
                var noUserFoundMsg =
                    "Видимо, мы с Вами пока еще не достаточно знакомы. " +
                    "Пожалуйста, зарегестрируйтесь с помощью команды mynameis <Ваше имя в гугл доке>. " +
                    "Пример:\nmynameis Артем Рысюк";
                that._postMessage(message.channel, noUserFoundMsg);
            }
        });
        db.close();
    });
};

Lunchbot.prototype._postMessage = function (channelId, text, params) {
    this.postMessage(channelId, text, params || {
            icon_url: "http://wf.sharebox.s3.amazonaws.com/mturchyn/slackbot-avatar.png"
        });
};

module.exports = Lunchbot;