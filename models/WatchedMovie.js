var mongoose = require('mongoose');

const ratingSchema = mongoose.Schema({
  user: String,
  message: String,
  score: Number,
});

const watchedMovieSchema = mongoose.Schema({
  movie: mongoose.Mixed,
  watchedOn: Date,
  score: Number,
  ratings: [ratingSchema],
});

const WatchedMovie = mongoose.model('watched-movie', watchedMovieSchema);

module.exports = WatchedMovie;