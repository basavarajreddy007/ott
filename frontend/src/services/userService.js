import api from './api';

export const getUser = (email) =>
    api.get(`/api/v1/users/${email}`).then(res => res.data.data);

export const updateUser = (email, data) =>
    api.patch(`/api/v1/users/${email}`, data).then(res => res.data.data);
