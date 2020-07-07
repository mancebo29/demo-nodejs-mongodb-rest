var mongoose = require('mongoose');
var statsd = require('./statsd');
var axios = require('axios');

var movieSchema = mongoose.Schema({
    name: String,
    order: Number,
    year: Number,
    rating: Number,
    link: String,
    genre: String
});

movieSchema.methods.getInfo = async () => {
    await axios.get(`http://www.omdbapi.com/?t=${this.name}&apikey=a12307ca`).then(data => {
        this.year = data.Year;
        this.name = data.Title;
        this.rating = data.imdbRating;
        this.link = data.imdbID ? `https://www.imdb.com/title/${data.data.imdbID}` : undefined;
        this.genre = data.Genre;
    });
};
var Movie = mongoose.model('movie-queue', movieSchema);

module.exports = {
    connectDB : function() {
        mongoose.connect(process.env.MONGODB_ADDON_URI, { useNewUrlParser: true });
    },

    enqueue: async function (title, order = null) {
        if (!order) {
            await new Promise(resolve => Movie.find((err, movies) => {
                order = movies.reduce((max, current) => {
                   return Math.max(max, current);
                }, 0);
                resolve();
            }));
        }
        const movie = new Movie({ name: title, order });
        return movie.getInfo().then(() =>  movie.save());
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

    getVal : function(res) {
        Values.find(function(err, result) {
            if (err) {
                console.log(err);
                res.send('database error');
                return
            }
            var values = {};
            for (var i in result) {
                var val = result[i];
                values[val["_id"]] = val["value"]
            }
            var title = process.env.TITLE || 'NodeJS MongoDB demo'
            res.render('index', {title, values: values});
        });
    },

    sendVal : function(val, res) {
        var request = new Values({value: val});
        request.save((err, result) => {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({status: "error", value: "Error, db request failed"}));
                return
            }
            this.updateGauge();
            statsd.increment('creations');
            res.status(201).send(JSON.stringify({status: "ok", value: result["value"], id: result["_id"]}));
        });
    },

    delVal : function(id) {
        Values.remove({_id: id}, (err) => {
            if (err) {
                console.log(err);
            }
            this.updateGauge();
            statsd.increment('deletions');
        });
    }
};
