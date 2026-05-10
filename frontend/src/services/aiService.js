import api from './api';

export const scriptChat = (message, history, sessionId, signal) =>
    api.post('/api/ai/script-chat', { message, history, sessionId }, { signal });

export const scriptAnalyze = (script, history) =>
    api.post('/api/ai/script-analyze', { script, history });

export const getSessions = () =>
    api.get('/api/ai/sessions');

export const getSession = (id) =>
    api.get(`/api/ai/sessions/${id}`);

export const saveSession = (title, messages) =>
    api.post('/api/ai/sessions', { title, messages });

export const deleteSession = (id) =>
    api.delete(`/api/ai/sessions/${id}`);
