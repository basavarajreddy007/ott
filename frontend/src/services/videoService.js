import api from './api';

export const getVideosByUser = (email) =>
    api.get(`/api/v1/videos/user/${email}`).then(res => res.data.data || []);

export const updateVideo = (videoId, data) =>
    api.put(`/api/v1/videos/${videoId}`, data).then(res => res.data.data);

export const updateThumbnail = (videoId, file) => {
    const form = new FormData();
    form.append('thumbnail', file);
    return api.patch(`/api/v1/videos/${videoId}/thumbnail`, form).then(res => res.data.data);
};

export const deleteVideo = (videoId) =>
    api.delete(`/api/v1/videos/${videoId}`);
