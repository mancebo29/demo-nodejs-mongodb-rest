var mongoose = require('mongoose');
var Movie = require('Movie');

var stateSchema = mongoose.Schema({
  lastForm: String,
  isTieBreaking: Boolean,
  movieSuggestions: {
    type: Map,
    of: Movie,
  },
});

var State = mongoose.model('movie-queue-state', stateSchema);

module.exports = State;