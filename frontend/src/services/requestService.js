import api from './api';

export const getRequests = () =>
    api.get('/requests').then(r => r.data.data || []);

export const createRequest = title =>
    api.post('/requests', { title }).then(r => ({
        data: r.data.data,
        incremented: r.data.incremented || false
    }));
