import api from './api';

export const getUser = email =>
    api.get(`/users/${email}`).then(res => res.data.data);

export const updateUser = (email, data) =>
    api.patch(`/users/${email}`, data).then(res => res.data.data);
