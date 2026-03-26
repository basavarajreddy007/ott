import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/upload.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAX_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/x-matroska', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_EXTS = '.mp4,.mkv,.webm,.mov,.avi';
const INIT_FORM = { title: '', description: '', duration: '', releaseYear: '', type: 'Movie', genres: '' };

export default function Upload() {
    const navigate = useNavigate();
    const dropRef = useRef(null);

    const [form, setForm] = useState(INIT_FORM);
    const [videoOption, setVideoOption] = useState('file');
    const [videoUrl, setVideoUrl] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [thumbOption, setThumbOption] = useState('url');
    const [thumbUrl, setThumbUrl] = useState('');
    const [thumbFile, setThumbFile] = useState(null);
    const [thumbPreview, setThumbPreview] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [dragging, setDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (thumbFile) {
            const url = URL.createObjectURL(thumbFile);
            setThumbPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setThumbPreview(thumbUrl || '');
    }, [thumbFile, thumbUrl]);

    const validateVideo = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) return 'Invalid file type. Allowed: MP4, MKV, WebM, MOV, AVI.';
        if (file.size > MAX_SIZE) return `File too large. Max size is ${MAX_SIZE / 1024 / 1024}MB.`;
        return null;
    };

    const pickVideo = (file) => {
        const err = validateVideo(file);
        if (err) { setError(err); return; }
        setVideoFile(file);
        setError('');
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) pickVideo(file);
    };

    const reset = () => {
        setForm(INIT_FORM);
        setVideoUrl(''); setVideoFile(null);
        setThumbUrl(''); setThumbFile(null);
        setThumbPreview(''); setAiPrompt('');
        setProgress(0); setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        if (!form.title || !form.description) return setError('Title and description are required.');
        if (videoOption === 'url' && !videoUrl) return setError('Please provide a video URL.');
        if (videoOption === 'file' && !videoFile) return setError('Please select a video file.');
        if (thumbOption === 'url' && !thumbUrl) return setError('Please provide a thumbnail URL.');
        if (thumbOption === 'file' && !thumbFile) return setError('Please upload a thumbnail file.');

        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('description', form.description);
        fd.append('duration', form.duration);
        if (form.releaseYear) fd.append('releaseYear', form.releaseYear);
        fd.append('type', form.type);
        fd.append('genres', form.genres.split(',').map(g => g.trim()).filter(Boolean).join(','));
        if (videoOption === 'url') fd.append('videoUrl', videoUrl); else fd.append('video', videoFile);
        if (thumbOption === 'url') fd.append('thumbnailUrl', thumbUrl); else fd.append('thumbnail', thumbFile);

        setLoading(true);
        setProgress(0);
        try {
            const res = await axios.post(`${API}/api/v1/videos`, fd, {
                headers: { Authorization: `Bearer ${token}` },
                onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)); }
            });
            if (!res.data.success) throw new Error(res.data.error || 'Upload failed');
            setSuccess(true);
            setProgress(100);
            setTimeout(reset, 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const fmtBytes = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

    const genAiThumb = () => {
        const p = aiPrompt || `${form.title || 'Movie'} ${form.description || ''} cinematic poster 8k`;
        setThumbUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random() * 100000)}`);
    };

    return (
        <div className="upload-page">
            <div className="upload-container">
                <div className="upload-header">
                    <h2 className="upload-title">Publish Video</h2>
                    <p className="upload-subtitle">Share your content with the world</p>
                </div>

                {success && (
                    <div className="upload-alert upload-alert--success">
                        <span className="upload-alert__icon">✓</span>
                        Video published successfully! Redirecting...
                    </div>
                )}

                {error && (
                    <div className="upload-alert upload-alert--error">
                        <span className="upload-alert__icon">✕</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="upload-row">
                        <div className="upload-field">
                            <label className="upload-label">Title *</label>
                            <input className="upload-input" name="title" placeholder="e.g. Inception" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                    </div>

                    <div className="upload-row">
                        <div className="upload-field">
                            <label className="upload-label">Description *</label>
                            <textarea className="upload-textarea" name="description" placeholder="Write a captivating summary..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                        </div>
                    </div>

                    <div className="upload-row">
                        <div className="upload-field">
                            <label className="upload-label">Video Source *</label>
                            <div className="upload-toggle">
                                <button type="button" className={`upload-toggle__btn${videoOption === 'file' ? ' active' : ''}`} onClick={() => setVideoOption('file')}>Local File</button>
                                <button type="button" className={`upload-toggle__btn${videoOption === 'url' ? ' active' : ''}`} onClick={() => setVideoOption('url')}>External URL</button>
                            </div>

                            {videoOption === 'url'
                                ? <input className="upload-input" type="url" placeholder="https://example.com/video.mp4" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
                                : (
                                    <div
                                        ref={dropRef}
                                        className={`upload-dropzone${dragging ? ' dragging' : ''}${videoFile ? ' has-file' : ''}`}
                                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={onDrop}
                                        onClick={() => dropRef.current.querySelector('input').click()}
                                    >
                                        <input type="file" accept={ALLOWED_EXTS} onChange={e => { if (e.target.files?.[0]) pickVideo(e.target.files[0]); }} hidden />
                                        {videoFile ? (
                                            <div className="upload-dropzone__file">
                                                <span className="upload-dropzone__icon">🎬</span>
                                                <span className="upload-dropzone__name">{videoFile.name}</span>
                                                <span className="upload-dropzone__size">{fmtBytes(videoFile.size)}</span>
                                            </div>
                                        ) : (
                                            <div className="upload-dropzone__prompt">
                                                <span className="upload-dropzone__icon">⬆</span>
                                                <span className="upload-dropzone__text">Drag & drop your video here</span>
                                                <span className="upload-dropzone__hint">or click to browse — MP4, MKV, WebM, MOV, AVI · max 500MB</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                        </div>
                    </div>

                    <div className="upload-row">
                        <div className="upload-field">
                            <label className="upload-label">Thumbnail *</label>
                            <div className="upload-toggle">
                                <button type="button" className={`upload-toggle__btn${thumbOption === 'url' ? ' active' : ''}`} onClick={() => setThumbOption('url')}>URL</button>
                                <button type="button" className={`upload-toggle__btn${thumbOption === 'file' ? ' active' : ''}`} onClick={() => setThumbOption('file')}>Upload</button>
                                <button type="button" className={`upload-toggle__btn${thumbOption === 'ai' ? ' active' : ''}`} onClick={() => setThumbOption('ai')}>AI Generate</button>
                            </div>

                            {thumbOption === 'url' && <input className="upload-input" type="url" placeholder="https://example.com/cover.jpg" value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} />}
                            {thumbOption === 'file' && <input className="upload-input upload-input--file" type="file" accept="image/*" onChange={e => setThumbFile(e.target.files[0])} />}
                            {thumbOption === 'ai' && (
                                <div className="upload-ai-row">
                                    <input className="upload-input" type="text" placeholder="e.g. Cyberpunk city at night, neon lights, cinematic 4K" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                                    <button type="button" className="upload-btn-secondary" onClick={genAiThumb}>Generate</button>
                                </div>
                            )}

                            {thumbPreview && (
                                <div className="upload-thumb-preview">
                                    <img src={thumbPreview} alt="Thumbnail preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="upload-row upload-row--cols">
                        <div className="upload-field">
                            <label className="upload-label">Duration (min)</label>
                            <input className="upload-input" type="number" name="duration" placeholder="120" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">Release Year</label>
                            <input className="upload-input" type="number" name="releaseYear" placeholder="2024" value={form.releaseYear} onChange={e => setForm({ ...form, releaseYear: e.target.value })} />
                        </div>
                    </div>

                    <div className="upload-row upload-row--cols">
                        <div className="upload-field">
                            <label className="upload-label">Genres</label>
                            <input className="upload-input" type="text" name="genres" placeholder="Sci-Fi, Action, Drama" value={form.genres} onChange={e => setForm({ ...form, genres: e.target.value })} />
                        </div>
                        <div className="upload-field">
                            <label className="upload-label">Type</label>
                            <select className="upload-select" name="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="Movie">Movie</option>
                                <option value="TV Show">TV Show</option>
                            </select>
                        </div>
                    </div>

                    {loading && (
                        <div className="upload-progress">
                            <div className="upload-progress__header">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="upload-progress__track">
                                <div className="upload-progress__bar" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    <button className="upload-btn-primary" type="submit" disabled={loading}>
                        {loading
                            ? <span className="upload-btn-primary__inner"><span className="upload-spinner" />Uploading {progress}%</span>
                            : 'Publish Video'
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}
