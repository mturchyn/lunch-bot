var request = require('request');
var cheerio = require('cheerio');
var htmlEntities = require('html-entities').XmlEntities;
var entities = new htmlEntities();

function VkMenuScrapper(settings) {
    this.lunchVkPageUrl = settings.vkUrl || "https://vk.com/obed_minsk";
}

VkMenuScrapper.prototype.scrapeMenu = function(cb) {
    var options = {
        url: this.lunchVkPageUrl,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36'
    };

    request(options, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            var menuChoiceSpans = $('.pi_text').first().find('span');
            var menuOptions = [];
            menuChoiceSpans.each(function (i, span) {
                var menuOption = {};
                var decodedHtml = entities.decode(cheerio(span).html());
                var parts = decodedHtml.split("<br>");
                menuOption.title = parts[0];
                menuOption.items = parts.splice(1).filter(function(item) {
                    return item != "";
                }).map(function(item) {
                    return item.trim();
                });
                console.dir(menuOption);
                menuOptions.push(menuOption);
            });
            cb(null, menuOptions);
        } else {
            cb(error, null);

        }
    });
};

module.exports = VkMenuScrapper;