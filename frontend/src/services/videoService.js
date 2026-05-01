import api from './api';

export function getVideosByUser(email) {
    return api.get(`/videos/user/${email}`).then(function(res) {
        return res.data.data || [];
    });
}

export function updateVideo(videoId, data) {
    return api.put(`/videos/${videoId}`, data).then(function(res) {
        return res.data.data;
    });
}

export function updateThumbnail(videoId, file) {
    const form = new FormData();
    form.append('thumbnail', file);
    return api.patch(`/videos/${videoId}/thumbnail`, form).then(function(res) {
        return res.data.data;
    });
}

export function deleteVideo(videoId) {
    return api.delete(`/videos/${videoId}`);
}
