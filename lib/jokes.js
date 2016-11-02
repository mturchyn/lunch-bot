var Jokes = function Constructor() {
    this.listOfJokes = [
        'Отличный выбор!',
        'Приятного аппетита!',
        'Спасибо!',
        'Хорошего настроения!'
    ]
};

Jokes.prototype.getNextOne = function() {
    return this.listOfJokes[Math.floor(Math.random()*this.listOfJokes.length)];

};

module.exports = Jokes;