var axios = require('axios');
var mongodb = require('../db');
const URL = 'https://api.surveymonkey.com/v3/surveys/'

const surveyService = {

  createSurvey: async () => {
    const name = `La real película ${new Date().toLocaleDateString()}`;
    const movies = await mongodb.seeQueue();
    const survey = await axios.post(URL, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SURVEY_TOKEN}`
      },
      data: {
        'title': name,
        'pages': [
          {
            'title': name,
            'description': 'Todo esto para cumplir con el disparate de democracia',
            'position': 1,
            'questions': [
              {
                'family': 'multiple_choice',
                'subtype': 'vertical',
                'answers': {
                  'choices': movies.map(m => ({ text: m.asString() }))
                },
                'headings': [
                  {
                    'heading': 'Cuál de estos disparates te interesa ver? (Selecciona los que quieras)'
                  }
                ],
                'position': 2
              },
              {
                'family': 'open_ended',
                'subtype': 'single',
                'headings': [
                  {
                    'heading': 'Escribe tu nombre (Y no me vengas con un disparate por favor)'
                  }
                ],
                'position': 1
              }
            ]
          }
        ]
      }
    }).then(r => r.data);

    const collector = await axios.post(URL, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SURVEY_TOKEN}`
      },
      data: {
        type: 'weblink'
      }
    }).then(d => d.data);

    return { survey, url: collector.url }
  },
};

module.exports = surveyService;