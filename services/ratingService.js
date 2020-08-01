var mongodb = require('../db');
var utils = require('../utils/utils');
var logger = require('../logger/logger');

const ratingService = {
    rateMovie: async (message) => {
        try {
            message.channel.send('Dame el númerito')
                .then(sent => {
                    sent.react("👍");
                    sent.react("👎");
                    sent.react('1️⃣');
                    sent.react("2️⃣");
                    sent.react(":three:");
                    sent.react(':four:');
                    sent.react(':five:');
                    sent.react(':six:');
                    sent.react(':seven:');
                    sent.react(':eight:');
                    sent.react(':nine:');
                    sent.react(':ten:');
                }).catch(err => {
                    utils.handleError(err);
                });
        } catch (e) {
            utils.handleError(e, message);
        }
    }
};

module.exports = ratingService;