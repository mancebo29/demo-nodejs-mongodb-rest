const Discord = require('discord.js');
const client = new Discord.Client();
var mongodb       = require('../db');


module.exports = function setUpBot () {

    client.once('ready', () => {
        console.log('Ready!');
    });

    client.on('message', message => {
        if (message.content === '!movies') {
            mongodb.seeQueue().then(movies => {
               let reply = 'Las películas en queue son: ';
               movies.forEach(m => reply += '\n' + `${m.name} (${m.year})`);
               message.channel.send(reply);
            });
        }

        if (message.content.startsWith('!addMovie') || message.content.toLowerCase().startsWith('vamos a ver')) {
            let title;
            if (message.content.startsWith('!addMovie')) {
                title = message.content.substr(9);
            } else {
                title = message.content.substr(message.content.indexOf('a ver') + 5);
            }
            mongodb.enqueue(title).then(m => {
                message.channel.send(`Se agregó ${m.name} (${m.year})`)
            });
        }
    });

    client.login(process.env.BOT_TOKEN);
};
