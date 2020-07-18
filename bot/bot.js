const Discord = require('discord.js');
const client = new Discord.Client();
const movieServices = require('./movieServices');


module.exports = function setUpBot () {
    client.once('ready', () => {
        console.log('Ready!');
    });

    const checkPermission = (message) => {
        if (message.author.tag.endsWith('4990')) {
            message.channel.send('You don\'t have enough badges to train me');
            return false;
        }
        return true;
    };

    client.on('message', message => {
        if (message.mentions.has(client.user)) {
            if (message.content.includes('help') || message.content.includes('ayuda') || message.content.includes('aiuda')) {
                message.channel.send('Los comandos disponibles son: \n-`!addMovie` o `vamos a ver` seguido del nombre o link de IMDB de la película para agregarla al queue\n-`!rmMovie {index}` para remover una película\n-`!movies` para consultar la lista de películas (Si hay muchas películas tendrás que hacer `!movies -f` para verlas todas)\n-`!movieForm` para generar un form para decidir qué película ver.');
            }
            return;
        }
        if (message.author.tag && message.author.tag.endsWith('4806') && Math.random() < 0.34) {
            movieServices.messageForIvette(message);
        }
        if (message.content.startsWith('!movies')) {
            if (!checkPermission(message)) return;
            const full = message.content.endsWith('-f');
            movieServices.listMovies(message, full);
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

        if (message.content.startsWith('!results')) {
            if (!checkPermission(message)) return;
            movieServices.reportResults(message);
        }

        if (message.content.toLowerCase().includes('te amo') && Math.random() < 0.34) {
            message.reply('Eso me decía ella :\'c');
        }

        if (message.content.startsWith('!votes')) {
            if (!checkPermission(message)) return;
            movieServices.reportVoters(message);
        }

        if (message.content.startsWith('!klk')) {
            if (!checkPermission(message)) return;
            movieServices.dailyPoll(message);
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
    });

    client.login(process.env.BOT_TOKEN);
};
