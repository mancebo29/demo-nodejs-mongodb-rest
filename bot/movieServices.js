var surveyService = require('../services/googleForms');
var mongodb       = require('../db');

const errorCatcher = (e, message) => {
    console.log(e);
    if (e.message === 'Not Found') {
        message.channel.send('No encontré esa película :c');
        message.channel.send('Soy medio lentito así que prueba a ser más específico');
    } else {
        message.channel.send('No sé hacer eso :c');
    }
};

let creatingSurvey = false;

const sendMessageWithDelay = (message, text, delay = 1500) => {
    return new Promise(resolve => setTimeout(() => {
        message.channel.send(text);
        resolve();
    }, delay))
}

const movieServices = {
    listMovies: (message, full = false) => {
        mongodb.seeQueue().then(movies => {
            let reply = 'Las películas en queue son: ';
            let n = 1;
            for (const m of movies) {
                if (reply.length + m.asString(true).length >= 2000) {
                    if (full) {
                        message.channel.send(reply);
                        reply = '';
                    } else {
                        reply += '...';
                        message.channel.send(reply);
                        message.channel.send(`Y ${movies.length - movies.indexOf(m)} películas más.\nPuedes usar \`!movies -f\` para verlas todas`);
                        return;
                    }
                }
                reply += '\n' + `${n++}- ${m.asString(true)}`;
            };
            message.channel.send(reply);
        }).catch(e => errorCatcher(e, message));
    },

    addMovie: (message) => {
        let title, imdbId;
        if (message.content.startsWith('!addMovie')) {
            title = message.content.substr(9);
        } else {
            title = message.content.substr(message.content.indexOf('a ver') + 5);
        }

        if (title.includes('imdb.com')) {
            [title,imdbId] = title.match(/imdb.com\/title\/(\w+)/);
        }
        mongodb.enqueue(title.trim(), imdbId).then(m => {
            message.channel.send(`Se agregó ${m.asString(true)}`);
            console.log('THE RATING', m.rating);
            if (m.rating && Number(m.rating) < 7) {
                message.channel.send(`Ehm... Tomen en cuenta que solo tiene ${m.rating} en IMDB`);
            }
        }).catch(e => errorCatcher(e, message));
    },

    removeMovie: (message) => {
        const index = message.content.substr(8);
        mongodb.seeQueue().then(movies => {
            if (Number.isNaN(index)) {
                let reply = 'Indícame con el numerito please: ';
                let n = 1;
                movies.forEach(m => reply += '\n' + `${n++}- ${m.asString(true)}`);
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
    },

    clearQueue: (message) => {
        message.delete();
        mongodb.clear().then(() => message.channel.send('SE BORRÓ TODO!'));
    },

    createMovieForm: (message) => {
        if (creatingSurvey) {
            message.channel.send('Wey pero aguántese que estoy en eso');
            return;
        }
        creatingSurvey = true;
        message.channel.send('Ok, dame un segundo...');
        surveyService.createSurvey().then(result => {
            creatingSurvey = false;
            message.channel.send(result.url);
        }).catch(e => errorCatcher(e, message));
    },

    messageForIvette: (message) => {
        const messages = [
            `${message.author.toString()} vete para la cocina mejor`,
            `${message.author.toString()} prepárame un sandwich por ahí mismo`,
            `${message.author.toString()} eres mujer así que lo que digas no vale`,
            `Como que alguien se escapó de la cocina...`,
            `${message.author.toString()} muy interesante... Y definitivamente no es sarcasmo....`,
            `Diría algo cool de no haber sido ${message.author.toString()} quien dijo eso...`,
            `${message.author.toString()} estás borracha de nuevo?`,
            `...`,
        ];
        message.channel.send(messages[Math.round(Math.random() * (messages.length - 1))]);
    },

    reportResults: (message) => {
        if (creatingSurvey) {
            message.channel.send('AGUÁNTESE');
            return;
        }
        message.channel.send('Vamos a ver...');
        surveyService.fetchResponses().then(async (results) => {
            if (!results.length) {
                message.channel.send('Hubo un fallo :c');
            }
            if (results.length > 1) {
                message.channel.send('Eh... Ok ya tengo los resultados...');
                await sendMessageWithDelay(message, 'Pero hay un empate xD');
                const nextMessage = results.reduce((text, c) => `${text}${c.text}\n`, '');
                await sendMessageWithDelay(message, `Entre: ${nextMessage}`, 500);
            } else {
                message.channel.send('Señoras y señores, results are in...');
                await sendMessageWithDelay(message, 'Agárrense a sus asientos y prepárense');
                await sendMessageWithDelay(message, 'La película ganadora es...');
                await sendMessageWithDelay(message, '*REDOBLE DE TAMBORES*', 500);
                await sendMessageWithDelay(message, results[0].text, 2000);
            }
        }).catch(e => errorCatcher(e, message));
    }
};

module.exports = movieServices;
