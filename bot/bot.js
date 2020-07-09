const Discord = require('discord.js');
const client = new Discord.Client();
const movieServices = require('./movieServices');


module.exports = function setUpBot () {
    client.once('ready', () => {
        console.log('Ready!');
    });

    let davmiIsBack = false;

    const checkPermission = (message) => {
        if (message.author.tag.endsWith('8072')) {
            if (!davmiIsBack) {
                message.REPLY('VOLVISTEEEEEEEEEE!');
                davmiIsBack = true;
                return false;
            } else {
                message.channel.send('You don\'t have enough badges to train me');
                return false;
            }
        }
        return true;
    };

    client.on('message', message => {
        if (message.mentions.has(client.user)) {
            if (message.content.includes('help') || message.content.includes('ayuda') || message.content.includes('aiuda')) {
                message.channel.send('Los comandos disponibles son: \n-`!addMovie` o `vamos a ver` para agregar una película\n-`!rmMovie {index}` para remover una película\n-`!movies` para consultar la lista de películas\n-`!movieForm` para generar un form para decidir qué película ver.');
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

        if (message.content.toLowerCase().includes('te amo') && Math.random() < 0.34) {
            message.reply('Eso me decía ella :\'c');
        }
    });

    client.login(process.env.BOT_TOKEN);
};
