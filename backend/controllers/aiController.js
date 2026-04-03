const axios = require('axios');

async function callGemini(messages) {
    if (!process.env.GEMINI_KEY) throw new Error('No Gemini key');

    // Convert messages array to Gemini format
    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
        { contents },
        { timeout: 30000 }
    );

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned no content');
    return text;
}

async function callOpenRouter(messages) {
    if (!process.env.OPENROUTER_KEY) throw new Error('No OpenRouter key');

    const { data } = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        { model: 'meta-llama/llama-3.3-70b-instruct:free', messages },
        {
            headers: { Authorization: `Bearer ${process.env.OPENROUTER_KEY}` },
            timeout: 30000
        }
    );

    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('OpenRouter returned no content');
    return text;
}

async function callAI(messages) {
    try {
        const text = await callGemini(messages);
        console.log('[AI] responded via Gemini');
        return text;
    } catch (err) {
        console.warn('[AI] Gemini failed:', err.message, '— trying OpenRouter');
    }

    const text = await callOpenRouter(messages);
    console.log('[AI] responded via OpenRouter');
    return text;
}

exports.generateScript = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required' });

    try {
        const text = await callAI([{
            role: 'user',
            content: `You are an expert Hollywood script writer. Expand, assess, or outline the following movie concept or script piece:\n\n${prompt}`
        }]);
        res.json({ success: true, text });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.analyzeScript = async (req, res) => {
    const { script } = req.body;
    if (!script) return res.status(400).json({ success: false, error: 'Script is required' });

    try {
        const raw = await callAI([{
            role: 'user',
            content: `You are a professional Hollywood script analyst. Analyze the script below and respond ONLY with a valid JSON object — no markdown, no explanation outside the JSON.

The JSON must follow this exact structure:
{
  "overall": <integer 0-100>,
  "scores": {
    "tone": <integer 0-100>,
    "characters": <integer 0-100>,
    "dialogue": <integer 0-100>,
    "pacing": <integer 0-100>,
    "structure": <integer 0-100>
  },
  "strengths": [<string>, <string>, <string>],
  "improvements": [<string>, <string>, <string>],
  "summary": "<2-3 sentence overall verdict>"
}

Script:
${script}`
        }]);

        try {
            const match = raw.match(/\{[\s\S]*\}/);
            const analysis = JSON.parse(match ? match[0] : raw);
            return res.json({ success: true, analysis, structured: true });
        } catch {
            return res.json({ success: true, text: raw, structured: false });
        }
    } catch (err) {
        console.error('[analyzeScript]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};
