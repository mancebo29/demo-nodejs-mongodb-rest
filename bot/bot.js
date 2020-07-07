const Discord = require('discord.js');
const client = new Discord.Client();

module.exports = function setUpBot () {

    client.once('ready', () => {
        console.log('Ready!');
    });

    client.on('message', message => {
        if (message.content === 'henlo') {
            message.channel.send('Hello there.');
        }
    });

    client.login(process.env.BOT_TOKEN);
};
