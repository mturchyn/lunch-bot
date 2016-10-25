var Lunchbot = require('./lib/lunchbot');
var config = require('./conf/conf.json');
const winston = require('winston');
winston.add(winston.transports.File, { filename: 'lunchbot.log' });
winston.level = 'debug';


var bot = new Lunchbot({
    token: config.botSlackToken,
    name: 'Lunchbot',
    dbPath: './data/lunchbot.db',
    googleApiConfig: config.googleApi,
    mongodbUrl:config.mongodbUrl,
    googleDocKey: config.googleDocKey
});
bot.run();