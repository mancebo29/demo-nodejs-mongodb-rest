var logger = require('../logger/logger');

const utils = {
    suffle: (array) => {
        var currentIndex = array.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    },
    handleError: (e, message) => {
        logger.log('APPLICATION ERROR:', JSON.stringify(e), e);
        if (e.message === 'Not Found hue') {
            message.channel.send('No encontré esa película :c');
            message.channel.send('Soy medio lentito así que prueba a ser más específico');
        } else {
            message.channel.send('No sé hacer eso :c');
        }
    }
}

module.exports = utils;