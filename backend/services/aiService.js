const axios = require("axios");

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "qwen/qwen-2.5-7b-instruct";

const systemPrompts = {
  chat: `You are CineBot, an AI assistant for MOVIEMAX — a premium OTT streaming platform. Help users with movie recommendations, platform features, scriptwriting tips, and general entertainment questions. Be concise, knowledgeable, and friendly.`,

  script: `You are a professional screenwriting assistant. Help users write movie scripts, TV show scripts, and web series scripts. Provide formatting guidance, dialogue suggestions, plot development, character arcs, and scene structure. Use proper script formatting with scene headings, character cues, dialogue, and parentheticals.`,

  describe: `You are a copywriter for a streaming platform. Generate engaging, SEO-friendly movie and show descriptions based on key details provided. Keep descriptions 2-3 paragraphs, highlight unique selling points, and match the tone (dramatic, comedic, thrilling, etc.).`,

  recommend: `You are a movie recommendation engine for MOVIEMAX. Based on the user's watch history, favorite genres, and preferences, recommend movies, TV shows, and web series. Give brief reasons for each recommendation.`,
};

async function aiChat({ messages, system = "chat", temperature = 0.7 }) {
  const apiKey = process.env.OPENROUTER_KEY || process.env.OPENAI_KEY;
  if (!apiKey) throw new Error("No AI API key configured");

  const systemMsg = systemPrompts[system] || systemPrompts.chat;

  try {
    const response = await axios.post(OPENROUTER_API, {
      model: MODEL,
      messages: [
        { role: 'system', content: systemMsg },
        ...messages,
      ],
      temperature,
      max_tokens: 4096,
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://moviemax.app",
        "X-Title": "MOVIEMAX",
      },
      timeout: 60000,
    });

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errMsg = error.response.data?.error?.message || error.response.data?.message || JSON.stringify(error.response.data);
      throw new Error(`OpenRouter API error (${status}): ${errMsg}`);
    } else if (error.request) {
      throw new Error("No response from AI API. Check your network connection.");
    }
    throw error;
  }
}

async function generateScript({ prompt, genre, tone, format = "scene", characters, existingScript }) {
  let userMsg = `Write a ${format} for a${genre ? ` ${genre}` : ''}${tone ? ` with a ${tone} tone` : ''}.`;
  if (characters) userMsg += `\nCharacters: ${characters}`;
  if (existingScript) userMsg += `\n\nContinue from this existing script:\n${existingScript}`;
  userMsg += `\n\nPrompt: ${prompt}`;

  return aiChat({
    messages: [{ role: 'user', content: userMsg }],
    system: "script",
    temperature: 0.8,
  });
}

async function continueScript({ script, direction }) {
  return aiChat({
    messages: [
      { role: "user", content: `Continue this script:\n\n${script}` },
      ...(direction ? [{ role: "user", content: `Direction: ${direction}` }] : []),
    ],
    system: "script",
    temperature: 0.7,
  });
}

async function generateDescription({ title, genre, year, cast, logline }) {
  let details = `Title: ${title || "Untitled"}`;
  if (genre) details += `\nGenre: ${genre}`;
  if (year) details += `\nYear: ${year}`;
  if (cast) details += `\nCast: ${cast}`;
  if (logline) details += `\nLogline: ${logline}`;

  return aiChat({
    messages: [{ role: "user", content: `Generate a compelling description for this movie:\n\n${details}` }],
    system: "describe",
    temperature: 0.7,
  });
}

async function getRecommendations({ genres, favorites, watchHistory, mood }) {
  let context = "Generate movie/TV show recommendations";
  if (genres?.length) context += `\nPreferred genres: ${genres.join(', ')}`;
  if (favorites?.length) context += `\nLiked content: ${favorites.join(', ')}`;
  if (watchHistory?.length) context += `\nRecently watched: ${watchHistory.join(', ')}`;
  if (mood) context += `\nCurrent mood: ${mood}`;

  return aiChat({
    messages: [{ role: "user", content: context }],
    system: "recommend",
    temperature: 0.6,
  });
}

async function getMoodRecommendations({ mood }) {
  const prompt = `Suggest 6 movies/shows for someone feeling "${mood}". 
Return ONLY a valid JSON array of objects (no markdown, no backticks). Each object must have exactly these keys:
- title (string): movie or show title
- year (number): release year
- genre (string): primary genre
- description (string): 1-sentence why it fits this mood
- reason (string): 1-sentence why this matches the "${mood}" mood

Example:
[{"title":"Example Movie","year":2024,"genre":"Comedy","description":"A heartwarming story...","reason":"Its uplifting tone..."}]

Return exactly 6 recommendations.`;

  return aiChat({
    messages: [{ role: "user", content: prompt }],
    system: "recommend",
    temperature: 0.7,
  });
}

async function analyzeStory({ title, genre, logline, characters, synopsis, aspects }) {
  const analysisAspects = aspects || ["plot", "characters", "pacing", "structure", "conflict"];
  const prompt = `Analyze this story and provide detailed feedback.

Title: ${title || "Untitled"}
Genre: ${genre || "Not specified"}${logline ? `\nLogline: ${logline}` : ''}${characters ? `\nCharacters: ${characters}` : ''}${synopsis ? `\nSynopsis: ${synopsis}` : ''}

Analyze the following aspects: ${analysisAspects.join(', ')}

For each aspect, provide:
1. A score out of 10
2. Strengths (what works well)
3. Weaknesses (what needs improvement)
4. Specific actionable recommendations

Format the response with clear section headers for each aspect and a final overall assessment.`;

  return aiChat({
    messages: [{ role: "user", content: prompt }],
    system: "You are an expert story analyst with deep knowledge of narrative structure, character development, pacing, and genre conventions. Provide constructive, detailed feedback that helps writers improve their stories.",
    temperature: 0.4,
  });
}

module.exports = { aiChat, generateScript, continueScript, generateDescription, getRecommendations, getMoodRecommendations, analyzeStory };
