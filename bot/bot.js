const Discord = require('discord.js');
const client = new Discord.Client();
const movieServices = require('./movieServices');
const watchedService = require('./watchedService');
const generalService = require('./generalService');
const sinon = require('sinon');
var utils = require('../utils/utils');
var logger = require('../logger/logger');
var axios = require('axios');


module.exports = function setUpBot() {
    client.once('ready', () => {
        logger.log('Ready!');
        if (process.env.NODE_ENV === 'dev') {
            const testChannel = client.channels.resolve(process.env.DEFAULT_BOT_CHANNEL);
            client.channels.resolve = sinon.stub().returns(testChannel);
        }
        const testChannel = client.channels.resolve('734638568407826432');
        testChannel.send('Deployed!');
    });

    setInterval(async () => {
        const showNight = client.channels.resolve('806309328885383238');
        const time = +(new Date().toISOString().substr(11, 2)) - 4;
        switch (true) {
            case time <= 11:
                showNight.setName('Tv Show Morning');
                break;
            case time <= 19:
                showNight.setName('Tv Show Afternoon');
                break;
            default:
                showNight.setName('Tv Show Night');
                break;
        }
    }, 60 * 60 * 1000)

    const x = setInterval( async () => {
        const response = await axios.get("https://resultados.labreferencia.com/Account/Login", {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "en-US,en;q=0.9,es-419;q=0.8,es;q=0.7",
                "cache-control": "max-age=0",
                "content-type": "application/x-www-form-urlencoded",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1"
            },
            "referrer": "https://resultados.labreferencia.com/Account/Login",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": "UserName=JAIRO09286&Password=489286&RememberMe=true&RememberMe=false",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        }).then(r => r.data);
        if (response.includes('El nombre de usuario no existe o el sistema')) {
            return;
        } else {
            const channel = client.channels.resolve(process.env.DEFAULT_BOT_CHANNEL);
            channel.send('Wey ya');
        }
    }, 1000 * 60 * 15);

    console.log(x);

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
                message.channel.send(utils.HELP_MESSAGE);
            }
            return;
        }

        if (message.author.tag && false) {
            const authorCode = message.author.tag.substr(-4);
            switch (authorCode) {
                case '4806':
                    message.react('🍆');
                    break;
                case '8633':
                    message.react('💸');
                    break;
                case '6192':
                    message.react('🎬');
                    break;
                case '6779':
                    message.react('🔪');
                    break;
                case '4990':
                    message.react('💩');
                    break;
                case '0149':
                    message.react('🌈');
                    break;
                case '8703':
                    message.react('🦎');
                    break;
                case '4151':
                    message.react('🔥');
                    break;
                case '6745':
                    message.react('🇳');
                    message.react('🇴');
                    break;
                case '0018':
                    message.react('🌚');
                    break;
                case '6062':
                    message.react('🍉');
                    message.react('🍌');
                    break;
                case '8192':
                    message.react('🥺');
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

        if (message.content.startsWith(`${PREFIX}submit`)) {
            movieServices.submitMovie(message);
        }

        if (message.content.startsWith(`${PREFIX}customForm`)) {
            movieServices.openCustomForm(message);
        }

        if (message.content.startsWith(`${PREFIX}generateCustomForm`) || message.content.startsWith(`${PREFIX}gcf`)) {
            if (movieServices.currentCollector) {
                movieServices.currentCollector.stop();
            }
        }

        if (message.content.startsWith(`${PREFIX}customVotes`)) {
            movieServices.customVotes(message);
        }

        if (message.content.startsWith(`${PREFIX}rating`)) {
            movieServices.rateMovie(message);
        }

        if (message.content.startsWith(`${PREFIX}watched`)) {
            const full = message.content.includes('-f');
            const ratingMatch = message.content.match(/-r ?([\d.,]+) ?(-\w|$)/);
            const dateMatch = message.content.match(/-d ?(\d+\/\d+\/\d{4}) ?(-\w|$)/);
            const queryMatch = message.content.match(/-q ?(.+) ?(-\w|$)/);
            watchedService.listWatched(message, full, {
                rating: ratingMatch ? Number(ratingMatch[1]) : undefined,
                date: dateMatch ? dateMatch[1] : undefined,
                query: queryMatch ? queryMatch[1].toLocaleLowerCase().trim() : undefined,
            });
        }

        if (message.content.startsWith(`${PREFIX}move`)) {
            generalService.moveEveryone(message);
        }

        if (message.content.startsWith('Comencemos a ver')) {

        }

        if (message.content.startsWith('!rules')) {
            movieServices.rules(message);
        }
    });

    client.on('voiceStateUpdate', (prev, curr) => {
        const testChannel = client.channels.resolve('734638568407826432');
        if (curr.id === '302643343530393601') {
            const date = new Date();
            if (!prev.channel && curr.channel) {
            }

            if (!curr.channel && prev.channel) {
            }
        }
    });

    client.login(process.env.BOT_TOKEN);
};
