const axios = require('axios');

const MODELS = [
    'google/gemma-3-12b-it:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
];

async function callOpenRouter(messages) {
    for (const model of MODELS) {
        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', { model, messages }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`
                }
            });

            const data = response.data;

            if (data.choices?.[0]) {
                return data.choices[0].message.content;
            }

            const code = data.error?.code;
            if (code !== 429 && code !== 404) {
                throw new Error(data.error?.message || 'Unknown OpenRouter error');
            }
        } catch (error) {
            const code = error.response?.data?.error?.code;
            if (code !== 429 && code !== 404) {
                throw new Error(error.response?.data?.error?.message || 'Unknown OpenRouter error');
            }
        }
    }
    throw new Error('All AI models are currently rate-limited. Please try again in a moment.');
}

exports.generateScript = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const text = await callOpenRouter([{
            role: 'user',
            content: `You are an expert Hollywood script analyzer and writer. Please expand, assess, or outline the following movie concept or script piece: ${prompt}`
        }]);

        res.status(200).json({ success: true, text });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.analyzeScript = async (req, res) => {
    try {
        const { script } = req.body;
        if (!script) return res.status(400).json({ error: 'Script is required' });

        const text = await callOpenRouter([{
            role: 'user',
            content: `You are a professional Hollywood script analyst. Analyze the following script or scene in detail. Cover: overall tone & genre, character development, dialogue quality, pacing, plot structure, strengths, and specific improvement suggestions. Be direct and constructive.\n\nScript:\n${script}`
        }]);

        res.status(200).json({ success: true, text });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
