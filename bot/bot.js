const Discord = require('discord.js');
const client = new Discord.Client();
const movieServices = require('./movieServices');
const ratingServices = require('../services/ratingService');
const sinon = require('sinon');


module.exports = function setUpBot() {
    client.once('ready', () => {
        console.log('Ready!');
        if (process.env.NODE_ENV === 'dev') {
            const testChannel = client.channels.resolve(process.env.DEFAULT_BOT_CHANNEL);
            client.channels.resolve = sinon.stub().returns(testChannel);
        }
        const testChannel = client.channels.resolve('734638568407826432');
        testChannel.send('Deployed!');
    });

    const checkPermission = (message) => {
        return true;
    };

    client.on('message', message => {

        const PREFIX = process.env.BOT_COMMAND_PREFIX || '!';

        if (message.content === `${PREFIX}ping`) {
            message.channel.send("pong!");
        }

        if (message.mentions.has(client.user)) {
            let lowerMessage = message.content.toLowerCase();
            if (lowerMessage.includes('help') || lowerMessage.includes('ayuda') || lowerMessage.includes('aiuda') || lowerMessage.includes('sos')) {
                message.channel.send('Los comandos disponibles son: \n-`!addMovie` o `vamos a ver` seguido del nombre o link de IMDB de la película para agregarla al queue\n-`!rmMovie {index}` para remover una película\n-`!movies` para consultar la lista de películas (Si hay muchas películas tendrás que hacer `!movies -f` para verlas todas)\n-`!movieForm` para generar un form para decidir qué película ver.');
            }
            return;
        }

        if (message.author.tag && message.author.tag.endsWith('4806')) {
            message.react('🍆');
            if (Math.random() < 0.34) {
                // movieServices.messageForIvette(message);
            }
        }

        if (message.content.startsWith(`${PREFIX}movies`)) {
            if (!checkPermission(message)) return;
            const full = message.content.includes('-f');
            const genresMatch = message.content.match(/-g ?([\w, ]+) ?(-\w|$)/);
            const ratingMatch = message.content.match(/-r ?([\d.,]+) ?(-\w|$)/);
            const yearMatch = message.content.match(/-y ?([\d]{4}) ?(-\w|$)/);
            const queryMatch = message.content.match(/-q ?(.+) ?(-\w|$)/);
            movieServices.listMovies(message, full, {
                genres: genresMatch ? genresMatch[1].toLowerCase().trim().split(',') : undefined,
                rating: ratingMatch ? Number(ratingMatch[1]) : undefined,
                year: yearMatch ? Number(yearMatch[1]) : undefined,
                query: queryMatch ? queryMatch[1].toLocaleLowerCase().trim() : undefined,
            });
        }

        if (message.content.startsWith(`${PREFIX}addMovie`) || message.content.toLowerCase().startsWith('vamos a ver')) {
            if (!checkPermission(message)) return;
            movieServices.addMovie(message);
        }

        if (message.content.startsWith(`${PREFIX}rmMovies`)) {
            if (!checkPermission(message)) return;
            movieServices.removeMovies(message);
        }
        else if (message.content.startsWith(`${PREFIX}rmMovie`)) {
            if (!checkPermission(message)) return;
            movieServices.removeMovie(message);
        }

        if (message.content.startsWith(`${PREFIX}clearEntireMovieQueue`) && message.author.tag.endsWith('0149')) {
            if (!checkPermission(message)) return;
            movieServices.clearQueue(message);
        }

        if (message.content.startsWith(`${PREFIX}movieForm`)) {
            if (!checkPermission(message)) return;
            movieServices.createMovieForm(message);
        }

        if (message.content.startsWith(`${PREFIX}randomForm`)) {
            if (!checkPermission(message)) return;
            const countMatch = message.content.match(/!randomForm ?([\d]+) ?$/);

            movieServices.randomForm(message, countMatch ? Number(countMatch[1]) : undefined);
        }

        if (message.content.startsWith(`${PREFIX}results`)) {
            if (!checkPermission(message)) return;
            movieServices.reportResults(message);
        }

        if (message.content.toLowerCase().includes('te amo') && Math.random() < 0.34) {
            message.reply('Eso me decía ella :\'c');
        }

        if (message.content.startsWith(`${PREFIX}votes`)) {
            if (!checkPermission(message)) return;
            movieServices.reportVoters(message);
        }

        if (message.content.startsWith(`${PREFIX}klk`)) {
            if (!checkPermission(message)) return;
            movieServices.dailyPoll(message);
        }

        if (message.content.startsWith(`${PREFIX}opinions`)) {
            if (!checkPermission(message)) return;
            movieServices.opinions(message);
        }

        if (message.content.includes(' | ') && (message.author.tag.endsWith('4876') || message.author.tag.endsWith('0149'))) {
            movieServices.levelUp(message);
        }

        if (message.content.startsWith('penis')) {
            let url = null;
            switch (message.content.substr(6).trim().toLowerCase()) {
                case 'batman':
                    url = 'https://cdn.discordapp.com/attachments/692562023493402665/724977030323634256/FB_IMG_1592918385370.jpg';
                    break;
                case 'spiderman':
                    url = 'https://www.galerie-sakura.com/media/main/produit/285537613c4e8d0958f09f6a7b10da2515de6296.jpg';
                    break;
                case 'hulk':
                    url = 'https://www.galerie-sakura.com/media/main/produit/48397b28d09e891cc8a9e177d9668e451c893b55.jpg';
                    break;
                case 'ironman':
                    url = 'https://www.galerie-sakura.com/media/main/produit/538eb7fc40d9df54b3797af0d9bf903ecda2a88a.jpg';
                    break;
                case 'mario':
                    url = 'https://www.galerie-sakura.com/media/main/produit/64a5b56c22274d261605ec7f6a2e9c04bcd019b3.jpg';
                    break;
                case 'yoda':
                    url = 'https://www.galerie-sakura.com/media/main/produit/ee0bbfb7780f3da10ddf3bd21e9b992bdc83a693.jpg';
                    break;
            }

            if (url) {
                message.channel.send(message.author.toString(), { files: [url] });
            }
        }

        //Rating service
        if (message.content.startsWith(`${PREFIX}rating`)) {
            ratingServices.rateMovie(message);
        }
    });

    client.login(process.env.BOT_TOKEN);
};
