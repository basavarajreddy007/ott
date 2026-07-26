const axios = require("axios");
const { OPENROUTER_API_KEY, TINYFISH_API_KEY } = require("../config/env");

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp";
const TINYFISH_API = process.env.TINYFISH_API_URL || "https://api.tinyfish.io/v1/chat/completions";
const TINYFISH_MODEL = process.env.TINYFISH_MODEL || "gpt-4";
const systemPrompts = {
  chat: `You are CineBot, an AI assistant for MOVIEMAX — a premium OTT streaming platform. Help users with movie recommendations, platform features, scriptwriting tips, and general entertainment questions. Be concise, knowledgeable, and friendly.`,

  script: `You are a professional screenwriting assistant. Help users write movie scripts, TV show scripts, and web series scripts. Provide formatting guidance, dialogue suggestions, plot development, character arcs, and scene structure. Use proper script formatting with scene headings, character cues, dialogue, and parentheticals.`,

  describe: `You are a copywriter for a streaming platform. Generate engaging, SEO-friendly movie and show descriptions based on key details provided. Keep descriptions 2-3 paragraphs, highlight unique selling points, and match the tone (dramatic, comedic, thrilling, etc.).`,

  recommend: `You are a movie recommendation engine for MOVIEMAX. Based on the user's watch history, favorite genres, and preferences, recommend movies, TV shows, and web series. Give brief reasons for each recommendation.`,

  analyze: `You are an expert story analyst with deep knowledge of narrative structure, character development, pacing, and genre conventions. Provide constructive, detailed feedback that helps writers improve their stories.`,
};

const fallbackResponses = {
  chat: "The AI assistant is temporarily unavailable due to rate limits. Please try again in a moment.",
  script: "The AI script assistant is temporarily unavailable due to request limits. Please try again shortly or continue drafting your script manually.",
  describe: "Description generation is temporarily unavailable right now. Please add a short summary manually for now.",
  recommend: "Fresh recommendations are temporarily unavailable because the AI service is rate-limited. Please try again shortly.",
  analyze: "Story analysis is temporarily unavailable right now. Please try again shortly.",
  moodRecommend: '[{"title":"Inception","year":2010,"genre":"Sci-Fi","description":"A mind-bending thriller that rewards close attention and keeps the tension high.","reason":"Its layered storytelling makes it a great pick for viewers who enjoy clever, immersive narratives."},{"title":"The Grand Budapest Hotel","year":2014,"genre":"Comedy","description":"A visually charming and witty film with a warm, whimsical tone.","reason":"Its playful energy and rich character work make it ideal for relaxed, uplifting viewing."},{"title":"Parasite","year":2019,"genre":"Thriller","description":"A sharp and suspenseful drama that mixes social commentary with intense pacing.","reason":"It offers a gripping experience for viewers who want something smart and emotionally charged."},{"title":"Paddington 2","year":2017,"genre":"Comedy","description":"A heartfelt and endlessly charming story with a cozy, optimistic mood.","reason":"Its kindness and humor make it perfect when you want comfort and joy."},{"title":"Interstellar","year":2014,"genre":"Adventure","description":"A sweeping sci-fi journey filled with wonder, emotion, and scale.","reason":"It is a great fit for viewers who want something epic and reflective."},{"title":"La La Land","year":2016,"genre":"Romance","description":"A stylish and emotional musical romance with a bittersweet spark.","reason":"Its warmth and romance make it a strong choice for a heartfelt night in."}]',
};

function formatMessages(messages, system, temperature = 0.7, provider) {
  const systemMsg = systemPrompts[system] || systemPrompts.chat;

  return {
    model: provider.model,
    temperature,
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemMsg },
      ...messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    ],
  };
}

function createFallbackResponse(type, promptText = "") {
  if (type === "script" && promptText) {
    return {
      content: `[SCENE START]\n\nINT. CREATIVE LAB - NIGHT\n\nThe writer sits in front of a glowing display, fingers poised over the keyboard.\n\nWRITER\n(smiling gently)\nWe will make this story shine. Even in fallback mode, the creativity flows.\n\nThe screen fills with a simulated script responding to: "${promptText.replace(/"/g, "'")}".\n\n[SCENE END]`,
      usage: { simulation: true },
      fallback: true
    };
  }

  if (type === "chat" && promptText) {
    return {
      content: `Hello! I am CineBot, helper bot for MOVIEMAX. The primary AI service is offline or rate-limited, but I can help bounce ideas! You asked about: "${promptText}". Tell me more about your thoughts on this!`,
      usage: { simulation: true },
      fallback: true
    };
  }

  return {
    content: fallbackResponses[type] || fallbackResponses.chat,
    usage: { fallback: true },
    fallback: true,
  };
}

async function aiChat({ messages, system = "chat", temperature = 0.7, fallbackType = "chat" }) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";

  
  const providers = [];
  if (OPENROUTER_API_KEY) {
    providers.push({ type: "openrouter", key: OPENROUTER_API_KEY, model: OPENROUTER_MODEL });
    providers.push({ type: "openrouter", key: OPENROUTER_API_KEY, model: "google/gemini-2.0-flash-exp" });
    providers.push({ type: "openrouter", key: OPENROUTER_API_KEY, model: "meta-llama/llama-3-8b-instruct:free" });
  }
  if (TINYFISH_API_KEY) {
    providers.push({ type: "tinyfish", key: TINYFISH_API_KEY, model: TINYFISH_MODEL });
  }

  if (providers.length === 0) {
    return createFallbackResponse(fallbackType, lastUserMsg);
  }

  let lastError = null;
  for (const provider of providers) {
    try {
      const body = formatMessages(messages, system, temperature, provider);

      if (provider.type === "tinyfish") {
        const response = await axios.post(TINYFISH_API, body, {
          headers: {
            "Authorization": `Bearer ${provider.key}`,
            "Content-Type": "application/json",
          },
          timeout: 45000,
        });

        const choice = response.data.choices?.[0];
        const content = typeof choice?.message?.content === "string"
          ? choice.message.content
          : Array.isArray(choice?.message?.content)
            ? choice.message.content.map((part) => part.text || "").join("")
            : "";

        if (content) {
          return { content, usage: response.data.usage || {} };
        }
      }

      if (provider.type === "openrouter") {
        const response = await axios.post(OPENROUTER_API, body, {
          headers: {
            "Authorization": `Bearer ${provider.key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
            "X-Title": "MOVIEMAX",
          },
          timeout: 45000,
        });

        const choice = response.data.choices?.[0];
        const content = typeof choice?.message?.content === "string"
          ? choice.message.content
          : Array.isArray(choice?.message?.content)
            ? choice.message.content.map((part) => part.text || "").join("")
            : "";

        if (content) {
          return { content, usage: response.data.usage || {} };
        }
      }
    } catch (error) {
      console.warn(`[AI SERVICE WARN] Provider ${provider.type} with model ${provider.model} failed: ${error.message}`);
      lastError = error;
    }
  }

  console.error("[AI SERVICE ERROR] All providers failed. Activating mock fallback simulator. Last error:", lastError?.message);
  return createFallbackResponse(fallbackType, lastUserMsg);
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
    fallbackType: "script",
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
    fallbackType: "script",
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
    fallbackType: "describe",
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
    fallbackType: "recommend",
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
    fallbackType: "moodRecommend",
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
    system: "analyze",
    temperature: 0.4,
    fallbackType: "analyze",
  });
}

module.exports = { aiChat, generateScript, continueScript, generateDescription, getRecommendations, getMoodRecommendations, analyzeStory };
