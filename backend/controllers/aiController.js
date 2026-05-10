const axios = require('axios');
const Script = require('../models/Script');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openrouter/auto';
const REQUEST_TIMEOUT_MS = 45000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

const SCRIPT_WRITER_PROMPT = `You are a professional screenplay writer for an OTT platform. You co-write scripts conversationally, improve ideas, ask questions, and always respond in structured screenplay format with scenes, characters, and dialogues. Format your responses with clear sections: TITLE, GENRE, CHARACTERS, SCENE, and DIALOGUE when applicable.`;

const SCRIPT_CRITIC_PROMPT = `You are a screenplay critic. Analyze the script and provide a detailed breakdown. You MUST respond with ONLY a raw JSON object — no markdown, no code fences, no explanation outside the JSON. Use exactly this structure:
{
  "scores": {
    "Story Quality": <number 1-10>,
    "Character Depth": <number 1-10>,
    "Dialogue Strength": <number 1-10>,
    "Plot Consistency": <number 1-10>,
    "Engagement Level": <number 1-10>
  },
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."],
  "overall_feedback": "..."
}`;

async function callAI(messages, systemPrompt, temperature = 0.8) {
    if (!process.env.OPENROUTER_KEY) throw new Error('OPENROUTER_KEY is not configured');

    const response = await axios.post(
        OPENROUTER_URL,
        {
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
            ],
            temperature,
            max_tokens: 2048
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
                'X-Title': 'NeoStream Script Studio'
            },
            timeout: REQUEST_TIMEOUT_MS
        }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from AI');
    return content;
}

function sanitizeMessages(messages = []) {
    return messages
        .filter(m => m && typeof m.content === 'string' && m.content.trim())
        .slice(-MAX_HISTORY_MESSAGES)
        .map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH)
        }));
}

function normalizeAnalysis(analysis) {
    const defaultScores = {
        'Story Quality': 0,
        'Character Depth': 0,
        'Dialogue Strength': 0,
        'Plot Consistency': 0,
        'Engagement Level': 0
    };

    const sourceScores = analysis?.scores || {};
    const scores = Object.keys(defaultScores).reduce((acc, key) => {
        const raw = sourceScores[key] ?? sourceScores[key.replace(/ /g, '_')] ?? sourceScores[key.toUpperCase()] ?? 0;
        const numberValue = Number(raw);
        acc[key] = Number.isFinite(numberValue) ? Math.max(0, Math.min(10, numberValue)) : 0;
        return acc;
    }, {});

    return {
        scores,
        strengths: Array.isArray(analysis?.strengths) ? analysis.strengths : [],
        weaknesses: Array.isArray(analysis?.weaknesses) ? analysis.weaknesses : [],
        suggestions: Array.isArray(analysis?.suggestions) ? analysis.suggestions : [],
        overall_feedback: typeof analysis?.overall_feedback === 'string'
            ? analysis.overall_feedback
            : (typeof analysis === 'string' ? analysis : 'Analysis generated.')
    };
}

function getAiErrorMessage(err) {
    if (err.code === 'ECONNABORTED') return 'AI request timed out. Please try again.';
    const status = err.response?.status;
    if (status === 429) return 'AI service is busy right now. Please retry in a moment.';
    if (status === 401 || status === 403) return 'AI service authentication failed. Contact support.';
    if (status >= 500) return 'AI service is temporarily unavailable. Please try again.';
    return err.response?.data?.error?.message || err.message || 'AI request failed.';
}

exports.scriptChat = async (req, res) => {
    try {
        const { message, history = [], sessionId } = req.body;
        if (!message?.trim()) return res.status(400).json({ success: false, error: 'Message is required' });

        const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
        const messages = [
            ...sanitizeMessages(history),
            { role: 'user', content: trimmedMessage }
        ];

        const aiResponse = await callAI(messages, SCRIPT_WRITER_PROMPT);

        if (sessionId) {
            await Script.findByIdAndUpdate(sessionId, {
                $push: { messages: { $each: [{ role: 'user', content: trimmedMessage }, { role: 'assistant', content: aiResponse }] } }
            }).catch(() => {});
        }

        res.json({ success: true, response: aiResponse });
    } catch (err) {
        res.status(500).json({ success: false, error: getAiErrorMessage(err) });
    }
};

exports.scriptAnalyze = async (req, res) => {
    try {
        const { script, history = [] } = req.body;
        const sanitizedHistory = sanitizeMessages(history);
        const content = script || sanitizedHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
        if (!content?.trim()) return res.status(400).json({ success: false, error: 'Script content is required' });

        const aiResponse = await callAI([{ role: 'user', content: `Analyze this script:\n\n${content}` }], SCRIPT_CRITIC_PROMPT, 0.3);

        let analysis;
        try {
            const cleaned = aiResponse
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();
            const match = cleaned.match(/\{[\s\S]*\}/);
            analysis = normalizeAnalysis(match ? JSON.parse(match[0]) : { overall_feedback: cleaned });
        } catch {
            analysis = normalizeAnalysis({ overall_feedback: aiResponse });
        }

        res.json({ success: true, analysis });
    } catch (err) {
        res.status(500).json({ success: false, error: getAiErrorMessage(err) });
    }
};

exports.saveSession = async (req, res) => {
    try {
        const { title, messages } = req.body;
        if (!title?.trim()) return res.status(400).json({ success: false, error: 'Title is required' });

        const session = await Script.create({ userId: req.user._id, title, messages: messages || [] });
        res.status(201).json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getSessions = async (req, res) => {
    try {
        const sessions = await Script.find({ userId: req.user._id })
            .select('title createdAt messages')
            .sort('-createdAt')
            .lean();
        res.json({ success: true, data: sessions });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getSession = async (req, res) => {
    try {
        const session = await Script.findOne({ _id: req.params.id, userId: req.user._id });
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        res.json({ success: true, data: session });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const session = await Script.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
