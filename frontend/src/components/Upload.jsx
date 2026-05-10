import { useState } from 'react';
import api from '../services/api';
import '../css/upload.css';

async function uploadToCloudinary(file, onProgress) {
    const formData = new FormData();
    formData.append('video', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const baseURL = import.meta.env.VITE_API_URL || '';
        xhr.open('POST', `${baseURL}/api/upload/video`);

        const token = localStorage.getItem('token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.success && data.url) resolve({ url: data.url, duration: data.duration || 0 });
                else reject(new Error(data.error || 'Upload failed'));
            } catch {
                reject(new Error('Invalid server response'));
            }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
    });
}

export default function Upload() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [genres, setGenres] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [type, setType] = useState('Movie');
    const [requiredPlan, setRequiredPlan] = useState('Basic');
    const [videoOption, setVideoOption] = useState('file');
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [thumbUrl, setThumbUrl] = useState('');
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!title || !description) return setError('Title and description are required.');
        if (videoOption === 'file' && !videoFile) return setError('Please select a video file.');
        if (videoOption === 'url' && !videoUrl) return setError('Please provide a video URL.');

        setLoading(true);
        setError('');
        setProgress(0);

        try {
            let finalVideoUrl = videoUrl;
            let duration = 0;
            if (videoOption === 'file') {
                const result = await uploadToCloudinary(videoFile, setProgress);
                finalVideoUrl = result.url;
                duration = result.duration;
            }

            await api.post('/videos', {
                title,
                description,
                type,
                requiredPlan,
                genres: genres || undefined,
                releaseYear: releaseYear || undefined,
                videoUrl: finalVideoUrl,
                thumbnailUrl: thumbUrl || undefined,
                duration: duration || undefined
            });

            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="upload-page">
                <div className="upload-container">
                    <div className="upload-success">
                        <div className="upload-success__icon">✓</div>
                        <h3>Video Published</h3>
                        <p>Your video is live and ready to watch.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-page">
            <div className="upload-container">
                <h2 className="upload-title">Publish Video</h2>

                {error && <div className="upload-alert upload-alert--error">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="upload-field">
                        <label className="upload-label">Title *</label>
                        <input className="upload-input" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div className="upload-field">
                        <label className="upload-label">Description *</label>
                        <textarea className="upload-textarea" value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>

                    <div className="upload-field">
                        <label className="upload-label">Video Source *</label>
                        <div className="upload-toggle">
                            <button type="button" className={`upload-toggle__btn${videoOption === 'file' ? ' active' : ''}`} onClick={() => setVideoOption('file')}>File</button>
                            <button type="button" className={`upload-toggle__btn${videoOption === 'url' ? ' active' : ''}`} onClick={() => setVideoOption('url')}>URL</button>
                        </div>
                        {videoOption === 'file'
                            ? <input className="upload-input" type="file" accept=".mp4,.mkv,.webm,.mov,.avi" onChange={e => setVideoFile(e.target.files[0])} />
                            : <input className="upload-input" type="url" placeholder="https://example.com/video.mp4" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
                        }
                    </div>

                    {loading && videoOption === 'file' && (
                        <div className="upload-field">
                            <div className="upload-progress-bar">
                                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="upload-progress-label">Uploading {progress}%...</span>
                        </div>
                    )}

                    <div className="upload-field">
                        <label className="upload-label">Thumbnail URL</label>
                        <input className="upload-input" type="url" placeholder="https://example.com/cover.jpg" value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} />
                    </div>

                    <div className="upload-row upload-row--cols">
                        <div className="upload-field">
                            <label className="upload-label">Genres</label>
                            <input className="upload-input" placeholder="Sci-Fi, Action" value={genres} onChange={e => setGenres(e.target.value)} />
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">Release Year</label>
                            <input className="upload-input" type="number" placeholder="2024" value={releaseYear} onChange={e => setReleaseYear(e.target.value)} />
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">Type</label>
                            <select className="upload-select" value={type} onChange={e => setType(e.target.value)}>
                                <option>Movie</option>
                                <option>TV Show</option>
                                <option>Series</option>
                                <option>Short</option>
                                <option>Documentary</option>
                            </select>
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">Required Plan</label>
                            <select className="upload-select" value={requiredPlan} onChange={e => setRequiredPlan(e.target.value)}>
                                <option>Basic</option>
                                <option>Standard</option>
                                <option>Premium</option>
                            </select>
                        </div>
                    </div>

                    <button className="upload-btn-primary" type="submit" disabled={loading}>
                        {loading ? (videoOption === 'file' ? `Uploading ${progress}%...` : 'Saving...') : 'Publish Video'}
                    </button>
                </form>
            </div>
        </div>
    );
}
