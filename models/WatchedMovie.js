const mongoose = require('mongoose');
const { format } = require('date-fns');

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

watchedMovieSchema.methods.asString = function() {
  const score = this.score ? ` y le dimos un ${this.score}` : '';
  const date = this.watchedOn ? `La vimos el ${format(this.watchedOn, 'dd/MM/yyyy')}` : '';
  const year = this.movie.year ? ` (${this.movie.year}) ` : '';
  return `${this.movie.name}${year}${date}${score}`;
};

const WatchedMovie = mongoose.model('watched-movie', watchedMovieSchema);

module.exports = WatchedMovie;
