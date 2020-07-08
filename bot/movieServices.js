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

const movieServices = {
    listMovies: (message) => {
        mongodb.seeQueue().then(movies => {
            let reply = 'Las películas en queue son: ';
            let n = 1;
            movies.forEach(m => reply += '\n' + `${n++}- ${m.asString()}`);
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
            message.channel.send(`Se agregó ${m.asString()}`);
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
            `...`,
        ];
        message.reply(messages[Math.round(Math.random() * (messages.length - 1))]);
    }
};

module.exports = movieServices;
