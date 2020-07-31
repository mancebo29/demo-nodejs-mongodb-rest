var axios = require('axios');
var mongoose = require('mongoose');

var ratingSchema = mongoose.Schema({
    user: String,
    score: Number,
    movie: String,
});