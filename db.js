var mongoose = require('mongoose');
var Movie = require('./models/Movie');
var State = require('./models/State');

module.exports = {
    connectDB : function() {
        mongoose.connect(process.env.MONGODB_ADDON_URI, { useNewUrlParser: true });
    },

    enqueue: async function (title, imdbId = '', order = null) {
        if (!order) {
            await new Promise(resolve => Movie.find((err, movies) => {
                order = movies.reduce((max, current) => {
                   return Math.max(max, Number(current.order));
                }, 0) || 0;
                resolve();
            }));
        }
        const movie = new Movie({ name: title, order });
        await movie.getInfo(title, imdbId);
        movie.save();

        return movie;
    },

    seeQueue: function () {
        return new Promise(resolve => Movie.find((err, movies) => {
          if (err) {
            console.log(err);
          }
          resolve(movies);
        }));
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
                const [state] = s;
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
