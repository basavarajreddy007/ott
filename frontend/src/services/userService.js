import api from './api';

export function getUser(email) {
    return api.get(`/users/${email}`).then(function(res) {
        return res.data.data;
    });
}

export function updateUser(email, data) {
    return api.patch(`/users/${email}`, data).then(function(res) {
        return res.data.data;
    });
}
