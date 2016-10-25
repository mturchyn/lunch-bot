var Lunchbot = require('./lib/lunchbot');
var config = require('./conf/config.json');


var bot = new Lunchbot({
    token: config.botSlackToken,
    name: 'My Bot',
    dbPath: './data/lunchbot.db',
    googleApiConfig: config.googleApi
});
bot.run();