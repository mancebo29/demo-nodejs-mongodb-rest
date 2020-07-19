var mongoose = require('mongoose');

var stateSchema = mongoose.Schema({
  lastForm: String,
  isTieBreaking: Boolean,
});

var State = mongoose.model('movie-queue-state', stateSchema);

module.exports = State;