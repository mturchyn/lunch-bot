'use strict';

var util = require('util');
var Bot = require('slackbots');

/**
 * Constructor function. It accepts a settings object which should contain the following keys:
 *      token : the API token of the bot (mandatory)
 *      name : the name of the bot (will default to "LunchDeliveryBot")
 *
 * @param {object} settings
 * @constructor
 *
 */
var LunchDeliveryBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'LunchDeliveryBot';
    this.user = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(LunchDeliveryBot, Bot);

/**
 * Run the bot
 * @public
 */
LunchDeliveryBot.prototype.run = function () {
    LunchDeliveryBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
LunchDeliveryBot.prototype._onStart = function () {
    this._loadBotUser();
    this._welcomeMessage();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
LunchDeliveryBot.prototype._onMessage = function (message) {
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromLunchDeliveryBot(message)) {
        this._handleTextMessage(message);
    }
};

/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
LunchDeliveryBot.prototype._handleTextMessage = function (originalMessage) {
    console.log("Received message: " + originalMessage);
};

/**
 * Loads the user object representing the bot
 * @private
 */
LunchDeliveryBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

/**
 * Sends a welcome message in the channel
 * @private
 */
LunchDeliveryBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
LunchDeliveryBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
LunchDeliveryBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        (message.channel[0] === 'C' || message.channel[0] === 'G')
        ;
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the LunchDeliveryBot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
LunchDeliveryBot.prototype._isMentioningChuckNorris = function (message) {
    return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if a given real time message has ben sent by the LunchDeliveryBot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
LunchDeliveryBot.prototype._isFromLunchDeliveryBot = function (message) {
    return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
LunchDeliveryBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = LunchDeliveryBot;
