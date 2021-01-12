var utils = require('../utils/utils');

const generalService = {
    moveEveryone: async (message) => {
        try {
            // const hasPermission = message.member.hasPermission('MOVE_MEMBERS');
            // if (!hasPermission) {
            //     message.reply('Wey pero usted no tiene permiso de estar moviendo gente');
            // } else {

            // }
            const voiceChannels = message.client.channels.cache.filter((c) => c.type === 'voice');
            let reply = 'Ok, dime a cuál de estos channels los quieres mover:\n';
            voiceChannels.each((c) => reply += `${c.name.substr(0, 2)} - ${c.toString()} \n`);
            const newMessage = await message.reply(reply);
            const filter = (reaction, u) => u.id === message.author.id;
            const collector = newMessage.createReactionCollector(filter, { time: 5 * 60 * 1000 });
            collector.on('collect', async (r, u) => {
                try {
                    const targetChannel = voiceChannels.find(c => c.name.includes(r.emoji.name));

                    const currentChannel = message.member.voice.channel;
                    console.log(currentChannel);
                    const membersArray = Array.from(currentChannel.members.array());
                    for (const member of membersArray) {
                        member.voice.setChannel(targetChannel);
                    }
                    if (collector) {
                        collector.stop();
                    }
                } catch (e) {
                    utils.handleError(e, message);
                }
            });

            await Promise.all(voiceChannels.map((c) => newMessage.react(c.name.substr(0, 2))));
        } catch (e) {
            utils.handleError(e, message);
        }
    }
}

module.exports = generalService;