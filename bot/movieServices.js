var jokeService = require('../services/jokeService');
var surveyService = require('../services/googleForms');
var mongodb = require('../db');
var utils = require('../utils/utils');

let creatingSurvey = false;

let movieSuggestions = {};

const sendMessageWithDelay = (message, text, delay = 1500, channel = null) => {
    return new Promise(resolve => setTimeout(() => {
        (channel || message.channel).send(text);
        resolve();
    }, delay))
}

const deleteMovie = (index, message, movieList) => {
    if (Number.isNaN(index)) {
        let reply = 'Indícame con el numerito please: ';
        let n = 1;
        movieList.forEach(m => reply += '\n' + `${n++}- ${m.asString(true)}`);
        message.channel.send(reply);
    } else {
        const i = Number(index);
        const movieToRemove = movieList[i - 1];
        mongodb.dequeue(movieToRemove.name).then(() => {
            message.channel.send(`Mandé _${movieToRemove.name}_ a la mierda entonces`);
        }).catch(e => {

        });
    }
}

const movieServices = {
    listMovies: (message, full = false, filters = {}) => {
        const filtersToUse = {};
        if (filters.year) {
            filtersToUse.year = { $gte: filters.year };
        }
        if (filters.rating) {
            filtersToUse.rating = { $gte: filters.rating };
        }
        if (filters.genres) {
            filtersToUse.genre = { $regex: `(${filters.genres.map(g => g.trim()).join('|')})`, $options: 'i' };
            console.log(filtersToUse.genres);
        }
        if (filters.query) {
            filtersToUse.name = { $regex: filters.query, $options: 'i' };
        }
        mongodb.seeQueue(filtersToUse).then(movies => {
            let reply = 'Las películas en queue son: ';
            let n = 1;
            for (const m of movies) {
                if (reply.length + m.asString(true).length >= 1990) {
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
        }).catch(e => utils.handleError(e, message));
    },

    addMovie: (message) => {
        let title, imdbId;
        if (message.content.includes('addMovie')) {
            title = message.content.substr(9);
        } else {
            title = message.content.substr(message.content.indexOf('a ver') + 5);
        }

        if (title.includes('imdb.com')) {
            [title, imdbId] = title.match(/imdb.com\/title\/(\w+)/);
        }
        mongodb.enqueue(title.trim(), imdbId, message.author.toString()).then(m => {
            message.channel.send(`Se agregó ${m.asString(true)}`);
            if (m.rating && Number(m.rating) < 7) {
                message.channel.send(`Ehm... Tomen en cuenta que solo tiene ${m.rating} en IMDB`);
            }
        }).catch(e => utils.handleError(e, message));
    },

    removeMovie: (message) => {
        const index = message.content.substr(8);
        mongodb.seeQueue().then(movies => {
            deleteMovie(index, message, movies);
        }).catch(e => utils.handleError(e, message));
    },

    removeMovies: (message) => {
        const indexes = message.content.substr(9).trim().split(',');
        mongodb.seeQueue().then(movies => {
            indexes.forEach(index => {
                deleteMovie(index, message, movies);
            });
        }).catch(e => utils.handleError(e, message));
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
        const pollsChannel = message.client.channels.resolve('733376737890533447');
        message.channel.send('Ok, dame un segundo...');
        surveyService.createSurvey().then(result => {
            creatingSurvey = false;
            pollsChannel.send(result.url);
        }).catch(e => utils.handleError(e, message));
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

    reportResults: async (message) => {
        if (creatingSurvey) {
            message.channel.send('AGUÁNTESE');
            return;
        }
        message.channel.send('Vamos a esto...');
        try {
            const { results, names, runnerUps, allScores } = await surveyService.fetchResponses();
            if (!results.length) {
                message.channel.send('Hubo un fallo :c');
            }
            const isTieBreaking = await mongodb.getStateKey('isTieBreaking');

            message.channel.send(`Tengo los votos de:\n${names.join('\n')}`);
            if (results.length > 1) {
                const pollsChannel = message.client.channels.resolve('733376737890533447');
                message.channel.send('Eh... Ok ya tengo los resultados...');
                await sendMessageWithDelay(message, 'Pero hay un empate xD');
                const nextMessage = results.reduce((text, c) => `${text}${c.text}\n`, '');
                await sendMessageWithDelay(message, `Entre: \n${nextMessage}`, 500);
                const movies = results.map(r => ({ asString: () => r.text }));
                const survey = await surveyService.createSurvey(movies, true);
                await sendMessageWithDelay(message, `Chequeen el canal de polls`);
                await pollsChannel.send(`Llenen esto para el desempate: ${survey.url}`);
                await mongodb.setStateKey('isTieBreaking', true);
            } else {
                message.channel.send('Señoras y señores, results are in...');
                const [winnerMovie] = results;
                const winnerTitle = winnerMovie.text;
                await sendMessageWithDelay(message, 'Agárrense a sus asientos y prepárense');
                await sendMessageWithDelay(message, 'La película ganadora es...');
                await sendMessageWithDelay(message, '*REDOBLE DE TAMBORES*', 3000);
                await sendMessageWithDelay(message, winnerTitle, 3000);
                await sendMessageWithDelay(message, `Con un total de ${winnerMovie.score} votos`, 3000);
                await mongodb.dequeue(winnerMovie.title.trim());
                await sendMessageWithDelay(message, 'Así que la sacaré del queue...');

                await mongodb.setStateKey('isTieBreaking', false);
            }


            if (!isTieBreaking) {
                const secondPlaces = runnerUps.reduce((text, c) => `${text}${c.text}\n`, '');
                if (runnerUps.length) {
                    await sendMessageWithDelay(message, `Quedando en segundo lugar:\n${secondPlaces}`);

                    await sendMessageWithDelay(message, `Pero esas se quedaron para una próxima`);
                }
                allScores.forEach(m => {
                    mongodb.updateScore(m.title, m.score);
                });
            }

        } catch (e) {
            utils.handleError(e, message);
        }
    },

    reportVoters: async (message) => {
        if (creatingSurvey) {
            message.channel.send('AGUÁNTESE');
            return;
        }

        message.channel.send('Déjame chequear...');
        try {
            const { names } = await surveyService.fetchResponses();
            message.channel
                .send(`Tengo hasta ahora ${names.length} voto${names.length === 1 ? '' : 's'}: ${names.join(', ')}`)
        } catch (e) {
            utils.handleError(e, message);
        }
    },

    levelUp: async (message) => {
        try {
            const generalChannel = message.client.channels.resolve('690318438077562902');
            const [user, level] = message.content.split(' | ');
            const j = await jokeService.getRandomJoke();
            const text = `Felicidades x${level}! :3`;

            let congratsMessage = `Felicidades ${user} por llegar al nivel ${level}.`;
            await generalChannel.send(congratsMessage);
            await generalChannel.send(`https://cataas.com/cat/says/${encodeURIComponent(text)}`);
            await generalChannel.send('Te ganaste un chiste:');

            if (j.type === 'single') {
                await sendMessageWithDelay(message, j.joke, 3000, generalChannel);
            } else {
                await sendMessageWithDelay(message, j.setup, 3000, generalChannel);
                await sendMessageWithDelay(message, j.delivery, 5000, generalChannel);
            }
        } catch (e) {
            utils.handleError(e, message);
        }
    },

    dailyPoll: async (message) => {
        try {
            const pollsChannel = message.client.channels.resolve('733376737890533447');
            const sentMessage = await pollsChannel.send(
                `klk?\n:regional_indicator_a: Jackbox\n\n:regional_indicator_b: Among Us\n\n:regional_indicator_c: Movie Night\n\n:regional_indicator_d: D&D\n\n:regional_indicator_e: Algo más`
            );
            sentMessage.react('🇦');
            sentMessage.react('🇧');
            sentMessage.react('🇨');
            sentMessage.react('🇩');
            sentMessage.react('🇪');
        } catch (e) {
            utils.handleError(e, message);
        }
    },

    opinions: async (message) => {
        try {
            const movieNights = message.client.channels.resolve('727367585225506857');
            const membersArray = Array.from(movieNights.members.array());
            const shuffledArray = utils.suffle(membersArray);

            let n = 1;
            let reply = '';
            for (const user of shuffledArray) {
                reply = `${reply}${n++}- ${user}\n`;
            }
            message.channel.send(reply);
        } catch (e) {
            utils.handleError(e, message);
        }
    },

    randomForm: async (message, count) => {
        if (creatingSurvey) {
            message.channel.send('Wey pero aguántese que estoy en eso');
            return;
        }
        creatingSurvey = true;
        const pollsChannel = message.client.channels.resolve('733376737890533447');
        const generalChannel = message.client.channels.resolve('690318438077562902');
        await message.channel.send('Ok, dame un segundo...');
        const movies = await mongodb.seeQueue();
        const formMovies = utils.suffle(movies).slice(0, count || 10);
        surveyService.createSurvey(formMovies).then(result => {
            creatingSurvey = false;
            pollsChannel.send(result.url);
            generalChannel.send(formMovies.reduce((text, movie) => {
                return `${text}${movie.asString(true)}\n`;
            }, ''));
        }).catch(e => utils.handleError(e, message));
    },

    openCustomForm: async (message) => {
        try {
            if (creatingSurvey) {
                message.channel.send('Wey pero aguántese que estoy en eso');
                return;
            }
            creatingSurvey = true;
            const movieNight = message.client.channels.resolve('727367585225506857');

            const membersArray = Array.from(movieNight.members.array());

            await message.channel.send('Ok, dame un segundo...');
            for (const member of membersArray) {
                const chat = await member.createDM();
                await chat.send('Oye klk, manda `!submit {link-de-imdb}` donde _{link-de-imdb}_ es el link de imdb de la película que quieres proponer para hoy. Puedes usar el comando `!movies` y todos los filtros que quieras por aquí.');
            }
            message.channel.send('Revisen DM');
        } catch (e) {
            utils.handleError(e, message);
        }
    },

    closeCustomForm: async (message) => {
        const pollsChannel = message.client.channels.resolve('733376737890533447');
        const generalChannel = message.client.channels.resolve('690318438077562902');
        const testChannel = message.client.channels.resolve('721904569361104957');

        testChannel.send(movieSuggestions);

        const formMovies = Object.values(movieSuggestions);
        surveyService.createSurvey(formMovies).then(result => {
            creatingSurvey = false;
            movieSuggestions = {};
            pollsChannel.send(result.url);
            generalChannel.send(formMovies.reduce((text, movie) => {
                return `${text}${movie.asString(true)}\n`;
            }, ''));
        }).catch(e => utils.handleError(e, message));
    },

    submitMovie: async (message) => {
        try {
            const link = message.content.substr(7).trim();
            const selectedMovie = await mongodb.findMovie({ link });
            movieSuggestions[message.author.toString()] = selectedMovie;

            await message.channel.send(`Entonces me fui con ${selectedMovie.asString(true)}`);
            await message.channel.send('Gracias UwU');
        } catch (e) {
            utils.handleError(e, message);
        }
    }
};

module.exports = movieServices;
