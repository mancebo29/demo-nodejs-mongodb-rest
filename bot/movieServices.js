var jokeService = require('../services/jokeService');
var surveyService = require('../services/googleForms');
var mongodb = require('../db');
var utils = require('../utils/utils');
const WatchedMovie = require('../models/WatchedMovie');
const Movie = require('../models/Movie');

let creatingSurvey = false;

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
        if (message.author.toString() !== movieToRemove.addedBy
          && message.author.toString() !== '<@588178966523936777>') {
            message.reply('PERO DEJA DE ESTAR BORRANDO LAS PELÍCULAS DE LOS DEMÁS');
            return;
        }
        mongodb.dequeue(movieToRemove.name).then(() => {
            message.channel.send(`Mandé _${movieToRemove.name}_ a la mierda entonces`);
        }).catch(e => {
            utils.handleError(e);
        });
    }
}

async function allowMovieRemoval(sentMessage, message, m) {
    await sentMessage.react('❌');

    const filter = (reaction, u) => reaction.emoji.name === '❌' && u.id === message.author.id;
    const collector = sentMessage.createReactionCollector(filter, {time: 15 * 60 * 1000});
    collector.on('collect', async (r, u) => {
        try {
            if (u.toString() !== m.addedBy && u.toString() !== '<@588178966523936777>') {
                message.reply('PERO DEJA DE ESTAR BORRANDO LAS PELÍCULAS DE LOS DEMÁS');
                return;
            }
            await mongodb.dequeue(m.name.trim());
            await message.channel.send(`Okis, quité ${m.asString(true)} entonces :c`);
            if (collector) {
                collector.stop();
            }
        } catch (e) {
            utils.handleError(e, message);
        }
    });
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
        mongodb.seeQueue(filtersToUse).then(async (movies) => {
            if (!movies.length) {
                await message.channel.send('No encontré ninguna película :c');
                return;
            }
            if (movies.length === 1) {
                const [m] = movies;
                const reply = `La única que película que encontré fue:\n${m.asString(true)}\n\n_Le puedes dar a la X para quitarla_`;
                const sentMessage = await message.channel.send(reply);
                await allowMovieRemoval(sentMessage, message, m);
                return;
            }
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
        mongodb.enqueue(title.trim(), imdbId, message.author.toString()).then(async (m) => {
            const sentMessage = await message.channel.send(`Se agregó ${m.asString(true)}\n\n_Si no era esa, le puedes dar a la x para quitarla_`);
            await allowMovieRemoval(sentMessage, message, m);
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
                const movie = await mongodb.findMovie({ name: winnerMovie.title.trim() });
                console.log(movie, winnerMovie.title.trim());
                if (movie) {
                    const watchedMovie = new WatchedMovie({
                        movie,
                        watchedOn: new Date(),
                        score: 0
                    });
                    await watchedMovie.save();
                }
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
                `klk?\n:regional_indicator_a: Among Us\n\n:regional_indicator_b: Batalla en Pummel Party\n\n:regional_indicator_c: Cinema Night\n\n:regional_indicator_d: D&D\n\n:regional_indicator_e: Entonces algo más\n\n:regional_indicator_f: Fibbage y demás juegos de Jackbox`
            );
            sentMessage.react('🇦');
            sentMessage.react('🇧');
            sentMessage.react('🇨');
            sentMessage.react('🇩');
            sentMessage.react('🇪');
            sentMessage.react('🇫');
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

    currentCollector: null,

    openCustomForm: async (message) => {
        try {
            if (creatingSurvey) {
                message.channel.send('Wey pero aguántese que estoy en eso');
                return;
            }
            const pollsChannel = message.client.channels.resolve('733376737890533447');
            creatingSurvey = true;

            await message.channel.send('Ok, dame un segundo...');
            const sentMessage = await pollsChannel.send('Los que vayan a ver la película hagan react a este mensaje!');
            await sentMessage.react('👍');

            const filter = (reaction) => reaction.emoji.name === '👍';
            movieServices.currentCollector = sentMessage.createReactionCollector(filter, { time: 30 * 60 * 1000 });
            movieServices.currentCollector.on('collect', async (r, u) => {
                try {
                    if (u.bot) return;
                    const chat = await u.createDM();
                    await chat.send('Oye klk, manda `!submit {link-de-imdb}` donde _{link-de-imdb}_ es el link de imdb de la película (**SIN LAS LLAVES**) que quieres proponer para hoy. Puedes usar el comando `!movies` y todos los filtros que quieras por aquí.');
                    await chat.send(utils.HELP_MESSAGE);
                } catch (e) {
                    utils.handleError(e, message);
                }

            });
            movieServices.currentCollector.on('end', (r, u) => {
                message.channel.send('Pues ya voy a tirar el form');
                movieServices.closeCustomForm(message);
            });
        } catch (e) {
            utils.handleError(e, message);
        }
    },

    closeCustomForm: async (message) => {
        const pollsChannel = message.client.channels.resolve('733376737890533447');
        const generalChannel = message.client.channels.resolve('690318438077562902');

        const movieSuggestions = await mongodb.getStateKey('movieSuggestions');

        const formMovies = movieSuggestions.map(m => new Movie(m.movie));
        surveyService.createSurvey(formMovies).then(result => {
            creatingSurvey = false;
            mongodb.setStateKey('movieSuggestions', []);
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

            if (!selectedMovie) {
                message.channel.send('Compadre pero ponga el link que yo le doy! DIOSSSSS MÍO!');
                return;
            }

            const movieSuggestions = await mongodb.getStateKey('movieSuggestions') || [];
            const previousSubmissions = movieSuggestions.filter(m => m.user === message.author.toString());
            if (previousSubmissions.length > 2) {
                previousSubmissions[0].movie = selectedMovie;
            } else {
                movieSuggestions.push({user: message.author.toString(), movie: selectedMovie});
            }

            await mongodb.setStateKey('movieSuggestions', movieSuggestions);

            await message.channel.send(`Entonces me fui con ${selectedMovie.asString(true)}`);
            await message.channel.send('Gracias UwU');
        } catch (e) {
            utils.handleError(e, message);
        }
    },

    customVotes: async (message) => {
        try {
            const movieSuggestions = await mongodb.getStateKey('movieSuggestions');

            const reply = `Tengo los votos de: ${movieSuggestions.map(m => m.user).join('\n')}`;
            message.channel.send(reply);
        } catch (e) {
            utils.handleError(e, message);
        }
    },

    rateMovie: async (message) => {
        try {
            const lines = message.content.split('\n');
            const movieToRate = await mongodb.findWatchedMovie({ score: 0 });
            let totalScore = 0;
            let totalVotes = 0;
            const ratings = [];
            for (let line of lines) {
                const matches = line.match(/^(.+) *: *"(.+)" *(.+)/);
                if (!matches) continue;
                const [, person, tagline, scoreStr] = matches;
                const score = Number(scoreStr.replace(/[^\d.]/g, ''));
                if (person && tagline && score) {
                    ratings.push({
                        user: person,
                        message: tagline,
                        score,
                    });
                    totalScore += score || 0;
                    totalVotes++;
                }
            }

            movieToRate.ratings = ratings;
            movieToRate.score = Math.round(totalScore / totalVotes * 10) / 10;
            await movieToRate.save();

            await message.channel.send('Ok, a ver si entendí...');
            let summary = '';
            for (let rating of ratings) {
                summary += `${rating.user} Le dio un ${rating.score} y dijo _"${rating.message}"_\n`;
            }
            await message.channel.send(summary);
            await message.channel.send(`Si es así, entonces...`);
            await message.channel.send(`LA PELÍCULA TIENE UN MESITÓMETRO DE: ${movieToRate.score}`);
        } catch (e) {
            utils.handleError(e, message);
        }
    }
};

module.exports = movieServices;
