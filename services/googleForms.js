var axios = require('axios');
var mongodb = require('../db');
const URL = 'https://api.surveymonkey.com/v3/surveys/';

const genericConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SURVEY_TOKEN}`
  },
};

const surveyService = {

  createSurvey: async () => {
    const name = `La real película [${new Date().toISOString()}]`;
    const movies = await mongodb.seeQueue();
    const survey = await axios.post(URL, {
      'title': name,
      'pages': [
        {
          'title': 'Davmi vete al carajo',
          'description': 'Todo esto para cumplir con el disparate de democracia',
          'position': 1,
          'questions': [
            {
              'family': 'multiple_choice',
              'subtype': 'vertical',
              'answers': {
                'choices': movies.map(m => ({text: m.asString()}))
              },
              'headings': [
                {
                  'heading': 'Cuál de estos disparates te interesa ver? (Selecciona todos los que quieras)'
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
    }, genericConfig).then(r => r.data);

    const collector = await axios.post(`${survey.href}/collectors`, {
      type: 'weblink'
    }, genericConfig).then(d => d.data);

    await mongodb.setStateKey('lastForm', survey.href);

    return {survey, url: collector.url}
  },

  fetchResponses: async () => {
    const results = { names: [], movies: {} };
    const surveyUrl = await mongodb.getStateKey('lastForm');
    const responses = await axios.get(`${surveyUrl}/responses/bulk?per_page=39`, genericConfig).then(d => d.data);

    console.log('RESPONSES GOTTEN SUCCESSFULLY HUE');

    const choices = {};
    for (const data of responses.data) {
      const [page] = data.pages;
      const [name, choice] = page.questions;
      for (const answer of name.answers) {
        results.names.push(answer.text);
      }

      for (const answer of choice.answers) {
        if (!choices[answer.choice_id]) {
          choices[answer.choice_id] = 1;
        } else {
          choices[answer.choice_id] += 1;
        }
      }
    }

    console.log('THE HUE CHOICES ARE', choices);

    let winners = [];
    let score = 0;
    for (const [k, c] of Object.entries(choices)) {
      if (winners.length === 0) {
        winners.push(k);
        score = c;
      } else {
        if (c === score) {
          winners.push(k);
        } else if (c > score) {
          winners = [k];
        }
      }
    }
    console.log('ABOUT TO GET THE QUESTIO HUE');

    const originalQuestion = await axios.get(`${surveyUrl}/pages/${page.id}/questions/${choice.id}`, {}, genericConfig)
      .then(d => d.data);

    console.log('GOT ORIGINAL QUESTION HUE');

    const winningChoices = originalQuestion.answers.choices.filter(oc => winners.includes(oc.id));

    return winningChoices;
  },
};

module.exports = surveyService;
