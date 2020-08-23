var axios = require('axios');
var mongoose = require('mongoose');

var movieSchema = mongoose.Schema({
    name: String,
    order: Number,
    year: Number,
    rating: Number,
    link: String,
    genre: String,
    addedBy: String,
});

movieSchema.methods.getInfo = async function (title, imdbId) {
    const url = imdbId ? `http://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=a12307ca`
        : `http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=a12307ca`;
    console.log('HUHEUHEHUE: ', url);
    await axios.get(url).then(res => {
        const data = res.data;
        if (data) {
            if (data.Response && data.Response === 'False') {
                throw new Error('Not Found hue');
            }
            this.year = Number(data.Year) || 0;
            this.name = data.Title;
            this.rating = Number(data.imdbRating) || 0;
            this.link = data.imdbID ? `https://www.imdb.com/title/${data.imdbID}` : undefined;
            this.genre = data.Genre;
        }
    });
};

movieSchema.methods.asString = function(escapeLink = false) {
    const link = this.link ? (escapeLink ? `<${this.link}>` : this.link) : '';
    const suggestedBy = this.addedBy && escapeLink ? ` [${this.addedBy}] ` : '';
    return `${this.name} ${this.year ? `(${this.year}) ` : ''}${suggestedBy}${link}`;
};
var Movie = mongoose.model('movie-queue', movieSchema);

module.exports = Movie;
