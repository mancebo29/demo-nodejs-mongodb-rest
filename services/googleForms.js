var axios = require('axios');
var mongodb = require('../db');
const URL = 'https://api.surveymonkey.com/v3/surveys/';
var logger = require('../logger/logger');

const genericConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SURVEY_TOKEN}`
  },
};

const surveyService = {

  createSurvey: async (movies = null, isTieBreaking = false) => {
    const isTieBreaker = isTieBreaking;
    const name = `${isTieBreaking ? 'El real desempate' : 'La real película'} [${new Date().toISOString()}]`;
    if (!movies) {
      movies = await mongodb.seeQueue();
    }
    const survey = await axios.post(URL, {
      'title': name,
      'pages': [
        {
          'title': 'Davmi vete al carajo',
          'description': 'Todo esto para cumplir con el disparate de democracia',
          'position': 1,
          'questions': [
            {
              'family': isTieBreaker ? 'single_choice' : 'multiple_choice',
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
              'required': {
                'text': 'Compadre pero llene esto',
                'type': 'all',
                'amount': '3'
              },
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
    const names = [];
    const surveyUrl = await mongodb.getStateKey('lastForm');
    logger.log(`${surveyUrl}/responses/bulk?per_page=39`);
    const responses = await axios.get(`${surveyUrl}/responses/bulk?per_page=39`, genericConfig).then(d => d.data);

    const choices = {};
    let pageId, questionId;
    for (const data of responses.data) {
      const [page] = data.pages;
      pageId = page.id;
      const [name, choice] = page.questions;
      questionId = choice.id;
      for (const answer of name.answers) {
        names.push(answer.text);
      }

      for (const answer of choice.answers) {
        if (!choices[answer.choice_id]) {
          choices[answer.choice_id] = 1;
        } else {
          choices[answer.choice_id] += 1;
        }
      }
    }

    let winners = [];
    let runnerUps = [];
    let score = 0, lastScore = 0;
    for (const [k, c] of Object.entries(choices)) {
      if (c === lastScore) {
        runnerUps.push(k);
      }

      if (winners.length === 0) {
        winners.push(k);
        score = c;
      } else {
        if (c === score) {
          winners.push(k);
        } else if (c > score) {
          runnerUps = winners;
          winners = [k];
          lastScore = score;
          score = c;
        }
      }
    }
    logger.log(`${surveyUrl}/pages/${pageId}/questions/${questionId}`);

    const originalQuestion = await axios.get(`${surveyUrl}/pages/${pageId}/questions/${questionId}`, genericConfig)
      .then(d => d.data);

    const allScores = originalQuestion.answers.choices.map(oc => {
      let matches = oc.text.match(/^(.+)(\(\d{4}\))/);
      if (!matches) {
        logger.log('NON MATCHING MOVIE ERROR', oc.text);
        matches = oc.text.match(/^(.+)(\(\d{4}\))?(http.+)/);
      }
      const title = matches ? matches[1] : '';
      logger.log('TITLE', title);
      return {
        ...oc,
        title: title ? title.trim() : '',
        score: choices[oc.id],
      }
    });
    const winningChoices = allScores.filter(oc => winners.includes(oc.id));
    const runnerUpChoices = allScores.filter(oc => runnerUps.includes(oc.id));

    return { results: winningChoices, names, runnerUps: runnerUpChoices, allScores };
  },
};

module.exports = surveyService;
