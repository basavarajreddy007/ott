import api from './api';

export async function generateScript(prompt) {
    const res = await api.post('/ai/script', { prompt });
    if (!res.data.success) {
        throw new Error(res.data.error);
    }
    return { type: 'text', data: res.data.text };
}

export async function analyzeScript(script) {
    const res = await api.post('/ai/analyze', { script });
    if (!res.data.success) {
        throw new Error(res.data.error);
    }
    if (res.data.analysis) {
        return { type: 'structured', data: res.data.analysis };
    }
    return { type: 'text', data: res.data.text };
}
