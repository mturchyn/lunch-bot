var Lunchbot = require('./lib/lunchbot');


var bot = new Lunchbot({
    token: '', // Add a bot https://my.slack.com/services/new/bot and put the token
    name: 'My Bot',
    dbPath: './data/lunchbot.db'
});
bot.run();