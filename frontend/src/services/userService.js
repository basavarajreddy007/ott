import api from './api';

export const getUser = email =>
    api.get(`/users/${email}`).then(r => r.data.data);

export const updateUser = (email, data) =>
    api.patch(`/users/${email}`, data).then(r => r.data.data);
