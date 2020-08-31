var logger = require('../logger/logger');

const utils = {
    suffle: (array) => {
        var currentIndex = array.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    },

    handleError: (e, message) => {
        logger.log('APPLICATION ERROR:', JSON.stringify(e), e);
        switch (e.message) {
            case 'Not Found hue':
                message.channel.send('No encontré esa película :c');
                message.channel.send('Soy medio lentito así que prueba a ser más específico');
                break;
            case 'Movie already exists':
                message.channel.send('Pero esta película ya está equisdé');
                break;
            default:
                message.channel.send('No sé hacer eso :c');
                break;
        }
    },

    HELP_MESSAGE: 'Los comandos disponibles son: \n-`!addMovie` o `vamos a ver` seguido del nombre o link de IMDB de la película para agregarla al queue\n-`!rmMovie {index}` para remover una película\n-`!movies` para consultar la lista de películas. También puedes usar las siguientes opciones: \n\t-`-f` para mostrar la lista completa \n\t-`-q {texto}` para filtrar por el título de la película \n\t-`-y {año}` para filtrar películas de ese año o **después** \n\t-`-g {género}` para filtrar por género(s). En caso de que sea más de uno, sepáralos por comas \n\t-`-r {rating}` para establecer un puntaje mínimo de IMDB \n-`!movieForm` para generar un form para decidir qué película ver.',
}

module.exports = utils;
