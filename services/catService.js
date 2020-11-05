var axios = require('axios');

const genericConfig = {
    headers: {
        'Content-Type': 'application/json',
    },
};

const catService = {
    getRandomCat: async (text) => {
        return axios.get(`https://cataas.com/cat/says/${encodeURIComponent(text)}`, genericConfig).then(d => d.data);
    }
};

module.exports = catService;
