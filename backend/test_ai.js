const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();
const go = async () => {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openrouter/free',
            messages: [{ role: 'user', content: `test prompt` }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`
            }
        });
        const data = response.data;
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("axios failed", err);
    }
}
go();
