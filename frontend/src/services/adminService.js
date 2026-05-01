import api from './api';

export function getStats() {
    return api.get('/admin/stats').then(function(r) { return r.data.data; });
}

export function getAllUsers() {
    return api.get('/admin/users').then(function(r) { return r.data.data; });
}

export function updateUserRole(id, role) {
    return api.patch(`/admin/users/${id}/role`, { role }).then(function(r) { return r.data.data; });
}

export function updateUserPlan(id, plan) {
    return api.patch(`/admin/users/${id}/plan`, { plan }).then(function(r) { return r.data.data; });
}

export function deleteUser(id) {
    return api.delete(`/admin/users/${id}`);
}

export function getAllVideos() {
    return api.get('/admin/videos').then(function(r) { return r.data.data; });
}

export function updateAdminVideo(id, data) {
    return api.put(`/admin/videos/${id}`, data).then(function(r) { return r.data.data; });
}

export function deleteVideo(id) {
    return api.delete(`/admin/videos/${id}`);
}

export function getAllRequests() {
    return api.get('/admin/requests').then(function(r) { return r.data.data; });
}

export function deleteRequest(id) {
    return api.delete(`/admin/requests/${id}`);
}
