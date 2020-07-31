var mongodb = require('../db');
var utils = require('../utils/utils');
var logger = require('../logger/logger');

const ratingService = {
    rateMovie: async (message) => {
        try {
            logger.log("Llamada a rating");
            utils.handleError("error", "error");
            const sentMessage = await message.channel.send('Puedes dar tu score debajo');
            sentMessage.react(':one:');
            sentMessage.react(':two:');
            sentMessage.react(':three:');
            sentMessage.react(':four:');
            sentMessage.react(':five:');
            sentMessage.react(':six:');
            sentMessage.react(':seven:');
            sentMessage.react(':eight:');
            sentMessage.react(':nine:');
            sentMessage.react(':ten:');
            sentMessage.react('👍');
        } catch (e) {
            utils.handleError(e, message);
        }
    }
};

module.exports = ratingService;