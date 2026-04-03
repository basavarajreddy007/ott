import api from './api';

export async function generateScript(prompt) {
    const { data } = await api.post('/api/v1/ai/script', { prompt });
    if (!data.success) throw new Error(data.error);
    return { type: 'text', data: data.text };
}

export async function analyzeScript(script) {
    const { data } = await api.post('/api/v1/ai/analyze', { script });
    if (!data.success) throw new Error(data.error);
    return data.structured
        ? { type: 'structured', data: data.analysis }
        : { type: 'text', data: data.text };
}
