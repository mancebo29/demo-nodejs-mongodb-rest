const Discord = require('discord.js');
const client = new Discord.Client();
const movieServices = require('./movieServices');


module.exports = function setUpBot () {
    client.once('ready', () => {
        console.log('Ready!');
    });

    const checkPermission = (message) => {
        if (message.author.tag.endsWith('8072')) {
            message.channel.send('You don\'t have enough badges to train me');
            return false;
        }
        return true;
    };

    client.on('message', message => {
        if (message.content === '!movies') {
            if (!checkPermission(message)) return;
            movieServices.listMovies(message);
        }

        if (message.content.startsWith('!addMovie') || message.content.toLowerCase().startsWith('vamos a ver')) {
            if (!checkPermission(message)) return;
            movieServices.addMovie(message);
        }

        if (message.content.startsWith('!rmMovie')) {
            if (!checkPermission(message)) return;
            movieServices.removeMovie(message);
        }

        if (message.content.startsWith('!clearEntireMovieQueue')) {
            if (!checkPermission(message)) return;
            movieServices.clearQueue(message);
        }

        if (message.content.startsWith('!movieForm')) {
            if (!checkPermission(message)) return;
            movieServices.createMovieForm(message);
        }
    });

    client.login(process.env.BOT_TOKEN);
};
