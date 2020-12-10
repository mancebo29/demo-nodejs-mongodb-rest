var axios = require('axios');

const genericConfig = {
    headers: {
        'Content-Type': 'application/json',
    },
};

let lastMeme = null;
const jokeService = {

    getRandomJoke: async () => {
        const url = `https://www.reddit.com/r/dankmemes/top.json?t=day&count=3${lastMeme ? `&after=${lastMeme.name}` : ''}`;
        const res = await axios.get(url, genericConfig)
            .then(d => d.data);

        const meme = res.data.children[0].data;
        lastMeme = meme || null;

        console.log('MEME: ', JSON.stringify(meme));

        return meme;
    }
};

module.exports = jokeService;
