import api from './api';

export function getRequests() {
    return api.get('/requests').then(function(res) {
        return res.data.data || [];
    });
}

export function createRequest(title) {
    return api.post('/requests', { title }).then(function(res) {
        return { data: res.data.data, incremented: res.data.incremented || false };
    });
}
