const mongodb = require('../db');
const utils = require('../utils/utils');
const { parse } = require('date-fns');
var logger = require('../logger/logger');

const watchedService = {
    listWatched: (message, full = false, filters = {}) => {
        const filtersToUse = {};
        logger.log(filters);
        if (filters.date) {
            filtersToUse.date = { $gte: parse(filters.date, 'dd/MM/yyyy', new Date()) };
        }
        if (filters.rating) {
            filtersToUse.score = { $gte: filters.rating };
        }
        if (filters.query) {
            filtersToUse['movie.name'] = { $regex: filters.query, $options: 'i' };
        }
        mongodb.getWatchedMovies(filtersToUse).then(movies => {
            let reply = 'Aquí están las películas vistas:';
            let n = 1;
            if (movies.length === 1) {
                reply += '\n' + movies[0].getDetails();
            } else {
                for (const m of movies) {
                    if (reply.length + m.asString(true).length >= 1990) {
                        if (full) {
                            message.channel.send(reply);
                            reply = '';
                        } else {
                            reply += '...';
                            message.channel.send(reply);
                            message.channel.send(`Y ${movies.length - movies.indexOf(m)} películas más.\nPuedes usar \`!watched -f\` para verlas todas`);
                            return;
                        }
                    }
                    reply += '\n' + `${n++}- ${m.asString()}`;
                }
            }
            message.channel.send(reply);
        }).catch(e => utils.handleError(e, message));
    },
};

module.exports = watchedService;
