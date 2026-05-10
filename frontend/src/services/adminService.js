import api from './api';

export const getStats        = ()          => api.get('/admin/stats').then(r => r.data.data);
export const getAllUsers      = ()          => api.get('/admin/users').then(r => r.data.data.users || []);
export const updateUserRole  = (id, role)  => api.patch(`/admin/users/${id}/role`, { role }).then(r => r.data.data);
export const updateUserPlan  = (id, plan)  => api.patch(`/admin/users/${id}/plan`, { plan }).then(r => r.data.data);
export const deleteUser      = id          => api.delete(`/admin/users/${id}`);
export const getAllVideos     = ()          => api.get('/admin/videos').then(r => r.data.data.videos || []);
export const updateAdminVideo = (id, data) => api.put(`/admin/videos/${id}`, data).then(r => r.data.data);
export const deleteVideo     = id          => api.delete(`/admin/videos/${id}`);
export const getAllRequests   = ()          => api.get('/admin/requests').then(r => r.data.data.requests || []);
export const deleteRequest   = id          => api.delete(`/admin/requests/${id}`);
