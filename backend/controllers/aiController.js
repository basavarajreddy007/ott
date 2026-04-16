const axios = require('axios');

async function callGemini(messages) {
    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
        {
            contents: messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))
        }
    );

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function callOpenRouter(messages) {
    const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        { model: 'meta-llama/llama-3.3-70b-instruct:free', messages },
        { headers: { Authorization: `Bearer ${process.env.OPENROUTER_KEY}` } }
    );

    return res.data?.choices?.[0]?.message?.content;
}

async function callAI(messages) {
    try {
        return await callGemini(messages);
    } catch {
        return await callOpenRouter(messages);
    }
}

exports.generateScript = async (req, res) => {
    if (!req.body.prompt) return res.status(400).json({ error: 'Prompt required' });

    try {
        const text = await callAI([
            { role: 'user', content: `Write a movie script:\n${req.body.prompt}` }
        ]);

        res.json({ success: true, text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.analyzeScript = async (req, res) => {
    if (!req.body.script) return res.status(400).json({ error: 'Script required' });

    try {
        const raw = await callAI([
            { role: 'user', content: `Analyze and return JSON:\n${req.body.script}` }
        ]);

        const json = raw.match(/\{[\s\S]*\}/);
        res.json({ success: true, analysis: JSON.parse(json[0]) });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};