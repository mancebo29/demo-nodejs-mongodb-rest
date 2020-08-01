var mongodb = require('../db');
var utils = require('../utils/utils');
var logger = require('../logger/logger');

const ratingService = {
    rateMovie: async (message) => {
        try {
            message.channel.send('Ahora todos se creen criticos')
                .then(sent => {
                    sent.react('0️⃣ ');
                    sent.react('1️⃣');
                    sent.react("2️⃣");
                    sent.react('3️⃣');
                    sent.react('4️⃣');
                    sent.react('5️⃣');
                    sent.react('6️⃣');
                    sent.react('7️⃣');
                    sent.react('8️⃣');
                    sent.react('9️⃣');
                    sent.react('🔟');
                }).catch(err => {
                    utils.handleError(err);
                });
        } catch (e) {
            utils.handleError(e, message);
        }
    }
};

module.exports = ratingService;