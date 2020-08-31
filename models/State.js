var mongoose = require('mongoose');

var stateSchema = mongoose.Schema({
  lastForm: String,
  isTieBreaking: Boolean,
  movieSuggestions: [{
    user: String,
    movie: mongoose.Mixed,
  }],
});

var State = mongoose.model('movie-queue-state', stateSchema);

module.exports = State;