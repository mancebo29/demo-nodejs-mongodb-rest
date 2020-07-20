var mongoose = require('mongoose');
var Movie = require('./models/Movie');
var State = require('./models/State');
var logger = require('./logger/logger');

module.exports = {
    connectDB : function() {
        mongoose.connect(process.env.MONGODB_ADDON_URI, { useNewUrlParser: true });
    },

    enqueue: async function (title, imdbId = '', order = null) {
        if (!order) {
            await new Promise(resolve => Movie.find((err, movies) => {
                order = movies.reduce((max, current) => {
                   return Math.max(max, Number(current.order));
                }, 0) || Number.MAX_SAFE_INTEGER;
                resolve();
            }));
        }
        const movie = new Movie({ name: title, order });
        await movie.getInfo(title, imdbId);
        movie.save();

        return movie;
    },

    seeQueue: function () {
        return new Promise((resolve, reject) => Movie.find({}, null, { sort: { order: 1, rating: -1 } }, (err, movies) => {
            if (err) {
                reject(err);
            }
            resolve(movies);
        }));
    },

    updateScore: function (title, order) {
        return new Promise((resolve, reject) => Movie.findOne({ name: title }, (err, movie) => {
            if (err) {
                reject(err);
            }
            if (!movie) {
                logger.log(`MOVIE NOT FOUND: ${title}`);
                return resolve();
            }
            movie.order -= order;
            movie.save(resolve);
        }));
    },

    resetOrder: function () {
        return new Promise(resolve => Movie.updateMany({}, { order: Number.MAX_SAFE_INTEGER }, resolve));
    },

    dequeue: function (title) {
        return new Promise(resolve => Movie.remove({ name: title }, resolve));
    },

    clear: function () {
        return new Promise(resolve => Movie.remove({}, resolve));
    },

    setStateKey: function (key, value) {
        return new Promise(resolve => {
            State.find((err, s) => {
                if (err) {
                    console.log(err);
                }
                let [state] = s;
                if (!state) state = new State({ lastForm: '' });
                state[key] = value;
                state.save(resolve);
            });
        });
    },

    getStateKey: function (key) {
        return new Promise(resolve => {
            State.find((err, s) => {
                if (err) {
                    console.log(err);
                }
                const [state] = s;
                resolve(state[key]);
            });
        });
    },
};
