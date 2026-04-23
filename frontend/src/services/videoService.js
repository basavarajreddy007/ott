import api from './api';

export const getVideosByUser = email =>
    api.get(`/videos/user/${email}`).then(res => res.data.data || []);

export const updateVideo = (videoId, data) =>
    api.put(`/videos/${videoId}`, data).then(res => res.data.data);

export const updateThumbnail = (videoId, file) => {
    const form = new FormData();
    form.append('thumbnail', file);
    return api.patch(`/videos/${videoId}/thumbnail`, form).then(res => res.data.data);
};

export const deleteVideo = videoId =>
    api.delete(`/videos/${videoId}`);
