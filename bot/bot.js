const Discord = require('discord.js');
const client = new Discord.Client();
var mongodb       = require('../db');


module.exports = function setUpBot () {

    client.once('ready', () => {
        console.log('Ready!');
    });

    const checkPermission = (message) => {
        if (message.author.id == 8072) {
            message.channel.send('You don\'t have enough badges to train me');
            return false;
        }
        return true;
    };

    const errorCatcher = (e, message) => {
        console.log(e);
        if (e.message === 'Not Found') {
            message.channel.send('No encontré esa película :c');
            message.channel.send('Soy medio lentito así que prueba a ser más específico');
        } else {
            message.channel.send('No sé hacer eso :c');
        }
    };

    client.on('message', message => {
        if (message.content === '!movies') {
            if (!checkPermission(message)) return;

            mongodb.seeQueue().then(movies => {
               let reply = 'Las películas en queue son: ';
               let n = 1;
               movies.forEach(m => reply += '\n' + `${n++}- ${m.asString()}`);
               message.channel.send(reply);
            }).catch(e => errorCatcher(e, message));
        }

        if (message.content.startsWith('!addMovie') || message.content.toLowerCase().startsWith('vamos a ver')) {
            if (!checkPermission(message)) return;

            let title, imdbId;
            if (message.content.startsWith('!addMovie')) {
                title = message.content.substr(9);
            } else {
                title = message.content.substr(message.content.indexOf('a ver') + 5);
            }

            if (title.includes('imdb.com')) {
                [title,imdbId] = title.match(/imdb.com\/title\/(\w+)/);
                console.log('XXXXXX', imdbId)
            }
            mongodb.enqueue(title.trim(), imdbId).then(m => {
                message.channel.send(`Se agregó ${m.asString()}`);
            }).catch(e => errorCatcher(e, message));
        }

        if (message.content.startsWith('!rmMovie')) {
            if (!checkPermission(message)) return;

            const index = message.content.substr(8);
            mongodb.seeQueue().then(movies => {
                if (Number.isNaN(index)) {
                    let reply = 'Indícame con el numerito please: ';
                    let n = 1;
                    movies.forEach(m => reply += '\n' + `${n++}- ${m.asString()}`);
                    message.channel.send(reply);
                } else {
                    const i = Number(index);
                    const movieToRemove = movies[i - 1];
                    mongodb.dequeue(movieToRemove.name).then(() => {
                       message.channel.send(`Mandé _${movieToRemove.name}_ a la mierda entonces`);
                    }).catch(e => {
                        console.log(e);
                        message.channel.send('No sé hacer eso :c');
                    });
                }
            }).catch(e => errorCatcher(e, message));
        }

        if (message.content.startsWith('!clearEntireMovieQueue')) {
            if (!checkPermission(message)) return;

            message.delete();
            mongodb.clear().then(() => message.channel.send('SE BORRÓ TODO!'));
        }
    });

    client.login(process.env.BOT_TOKEN);
};
