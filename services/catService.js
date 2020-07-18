var axios = require('axios');

const genericConfig = {
    headers: {
        'Content-Type': 'application/json',
    },
};

const catService = {
    getRandomCat: async (text) => {
        const cat = await axios.get(`https://cataas.com/cat/says/${encodeURIComponent(text)}`, genericConfig).then(d => d.data);

        console.log('CAT: ', cat);

        return cat;
    }
};

module.exports = catService;
