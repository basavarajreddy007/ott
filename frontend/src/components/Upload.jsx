import { useState } from 'react';
import api from '../services/api';
import '../css/upload.css';

export default function Upload() {
    const [form, setForm] = useState({ title: '', description: '', genres: '', releaseYear: '', type: 'Movie' });
    const [videoOption, setVideoOption] = useState('file');
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [thumbUrl, setThumbUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title || !form.description) return setError('Title and description are required.');
        if (videoOption === 'file' && !videoFile) return setError('Please select a video file.');
        if (videoOption === 'url' && !videoUrl) return setError('Please provide a video URL.');

        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('description', form.description);
        fd.append('type', form.type);
        if (form.genres) fd.append('genres', form.genres);
        if (form.releaseYear) fd.append('releaseYear', form.releaseYear);
        if (videoOption === 'file') fd.append('video', videoFile);
        else fd.append('videoUrl', videoUrl);
        if (thumbUrl) fd.append('thumbnailUrl', thumbUrl);

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/api/v1/videos', fd);
            if (!res.data.success) throw new Error(res.data.error || 'Upload failed');
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    }

    if (success) return (
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

    return (
        <div className="upload-page">
            <div className="upload-container">
                <h2 className="upload-title">Publish Video</h2>

                {error && <div className="upload-alert upload-alert--error">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="upload-field">
                        <label className="upload-label">Title *</label>
                        <input className="upload-input" value={form.title} onChange={set('title')} required />
                    </div>

                    <div className="upload-field">
                        <label className="upload-label">Description *</label>
                        <textarea className="upload-textarea" value={form.description} onChange={set('description')} required />
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

                    <div className="upload-field">
                        <label className="upload-label">Thumbnail URL</label>
                        <input className="upload-input" type="url" placeholder="https://example.com/cover.jpg" value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} />
                    </div>

                    <div className="upload-row upload-row--cols">
                        <div className="upload-field">
                            <label className="upload-label">Genres</label>
                            <input className="upload-input" placeholder="Sci-Fi, Action" value={form.genres} onChange={set('genres')} />
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">Release Year</label>
                            <input className="upload-input" type="number" placeholder="2024" value={form.releaseYear} onChange={set('releaseYear')} />
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">Type</label>
                            <select className="upload-select" value={form.type} onChange={set('type')}>
                                <option>Movie</option>
                                <option>TV Show</option>
                                <option>Series</option>
                                <option>Short</option>
                                <option>Documentary</option>
                            </select>
                        </div>
                    </div>

                    <button className="upload-btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Uploading...' : 'Publish Video'}
                    </button>
                </form>
            </div>
        </div>
    );
}
