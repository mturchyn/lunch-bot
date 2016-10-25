var Lunchbot = require('./lib/lunchbot');
var config = require('./conf/config.json');


var bot = new Lunchbot({
    token: config.botSlackToken,
    name: 'Lunchbot',
    dbPath: './data/lunchbot.db',
    googleApiConfig: config.googleApi,
    mongodbUrl:config.mongodbUrl
});
bot.run();