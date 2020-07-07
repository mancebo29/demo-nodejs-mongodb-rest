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

    client.on('message', message => {
        if (message.content === '!movies') {
            if (!checkPermission(message)) return;

            mongodb.seeQueue().then(movies => {
               let reply = 'Las películas en queue son: ';
               let n = 1;
               movies.forEach(m => reply += '\n' + `${n++}- ${m.asString()}`);
               message.channel.send(reply);
            }).catch(e => {
                console.log(e);
                message.channel.send('No sé hacer eso :c');
            });;
        }

        if (message.content.startsWith('!addMovie') || message.content.toLowerCase().startsWith('vamos a ver')) {
            if (!checkPermission(message)) return;

            let title;
            if (message.content.startsWith('!addMovie')) {
                title = message.content.substr(9);
            } else {
                title = message.content.substr(message.content.indexOf('a ver') + 5);
            }
            mongodb.enqueue(title).then(m => {
                message.channel.send(`Se agregó ${m.asString()}`);
            }).catch(e => {
                console.log(e);
                message.channel.send('No sé hacer eso :c');
            });
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
                    mongodb.dequeue(movieToRemove.title).then(() => {
                       message.channel.send(`Mandé _${movieToRemove.title}_ a la mierda entonces`);
                    }).catch(e => {
                        console.log(e);
                        message.channel.send('No sé hacer eso :c');
                    });
                }
            }).catch(e => {
                console.log(e);
                message.channel.send('No sé hacer eso :c');
            });
        }
    });

    client.login(process.env.BOT_TOKEN);
};
