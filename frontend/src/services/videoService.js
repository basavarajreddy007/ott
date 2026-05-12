import api from './api';

export const getVideosByUser = email =>
    api.get(`/videos/user/${email}`).then(r => r.data.data || []);

export const updateVideo = (videoId, data) =>
    api.put(`/videos/${videoId}`, data).then(r => r.data.data);

export const updateThumbnail = (videoId, thumbnailUrl) =>
    api.patch(`/videos/${videoId}/thumbnail`, { thumbnailUrl }).then(r => r.data.data);

export const deleteVideo = videoId =>
    api.delete(`/videos/${videoId}`);
