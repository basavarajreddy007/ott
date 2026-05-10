import { useState, useEffect, useRef, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import { getVideosByUser, deleteVideo } from '../services/videoService';
import '../css/creator.css';

const UC_PUBLIC_KEY = '7e807198130f2e1f7c1e';

async function uploadToUploadcare(file, onProgress) {
    const fd = new FormData();
    fd.append('UPLOADCARE_PUB_KEY', UC_PUBLIC_KEY);
    fd.append('UPLOADCARE_STORE', '1');
    fd.append('file', file);
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://upload.uploadcare.com/base/');
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.file) resolve('https://ucarecdn.com/' + data.file + '/');
                else reject(new Error(data.detail || 'Uploadcare upload failed'));
            } catch { reject(new Error('Invalid response from Uploadcare')); }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(fd);
    });
}

const NAV_ITEMS = [
    { icon: '⊞', label: 'Overview', key: 'overview' },
    { icon: '↑',  label: 'Upload',   key: 'upload' },
    { icon: '▶',  label: 'My Videos', key: 'videos' },
];

function Sidebar({ active, onNav, user }) {
    const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'CR';
    return (
        <aside className="cd-sidebar">
            <div className="cd-sidebar__logo">STREAM<span>X</span></div>
            <nav className="cd-nav">
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.key}
                        className={`cd-nav__item${active === item.key ? ' active' : ''}`}
                        onClick={() => onNav(item.key)}
                    >
                        <span className="icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="cd-sidebar__footer">
                <div className="cd-avatar">
                    <div className="cd-avatar__pic">{initials}</div>
                    <div>
                        <div className="cd-avatar__name">{user?.username || 'Creator'}</div>
                        <div className="cd-avatar__role">Content Creator</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className="cd-stat">
            <div className="cd-stat__label">{label}</div>
            <div className={`cd-stat__value ${color || ''}`}>{value}</div>
        </div>
    );
}

function UploadSection({ onUploaded }) {
    const [form, setForm] = useState({ title: '', description: '', genres: '', releaseYear: '', type: 'Movie', plan: 'Basic' });
    const [videoOption, setVideoOption] = useState('file');
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [thumbUrl, setThumbUrl] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const dropRef = useRef();

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) { setVideoFile(file); setVideoOption('file'); }
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) return setError('Title and description are required.');
        if (videoOption === 'file' && !videoFile) return setError('Please drop or select a video file.');
        if (videoOption === 'url' && !videoUrl.trim()) return setError('Please enter a video URL.');
        setError('');
        setLoading(true);
        setProgress(0);
        try {
            const finalVideoUrl = videoOption === 'file'
                ? await uploadToUploadcare(videoFile, setProgress)
                : videoUrl.trim();
            await api.post('/videos', {
                title: form.title.trim(),
                description: form.description.trim(),
                type: form.type,
                requiredPlan: form.plan,
                genres: form.genres.trim() || undefined,
                releaseYear: form.releaseYear || undefined,
                videoUrl: finalVideoUrl,
                thumbnailUrl: thumbUrl.trim() || undefined,
            });
            setSuccess(true);
            setForm({ title: '', description: '', genres: '', releaseYear: '', type: 'Movie', plan: 'Basic' });
            setVideoFile(null); setVideoUrl(''); setThumbUrl(''); setProgress(0);
            onUploaded();
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Upload failed.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="cd-upload-card">
            {error && <div className="cd-alert error">⚠ {error}</div>}
            {success && <div className="cd-alert success">✓ Video uploaded — pending admin review.</div>}

            <div className="cd-source-toggle">
                <button type="button" className={`cd-toggle-btn${videoOption === 'file' ? ' active' : ''}`} onClick={() => setVideoOption('file')}>File Upload</button>
                <button type="button" className={`cd-toggle-btn${videoOption === 'url' ? ' active' : ''}`} onClick={() => setVideoOption('url')}>Video URL</button>
            </div>

            {videoOption === 'file' ? (
                <div
                    ref={dropRef}
                    className={`cd-dropzone${dragOver ? ' drag-over' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    <div className="cd-dropzone__icon">🎬</div>
                    <div className="cd-dropzone__text">Drag and drop your video here</div>
                    <div className="cd-dropzone__sub">MP4, MKV, WebM, MOV up to 500MB</div>
                    {videoFile
                        ? <div className="cd-dropzone__file">✓ {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</div>
                        : <div className="cd-dropzone__sub" style={{ marginTop: '8px' }}>or click to browse</div>
                    }
                    <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} />
                </div>
            ) : (
                <div className="cd-field" style={{ marginBottom: '20px' }}>
                    <label className="cd-label">Video URL *</label>
                    <input className="cd-input" type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://example.com/video.mp4" />
                </div>
            )}

            {loading && videoOption === 'file' && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="cd-progress">
                        <div className="cd-progress__bar" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="cd-form-grid">
                    <div className="cd-field full">
                        <label className="cd-label">Title *</label>
                        <input className="cd-input" value={form.title} onChange={set('title')} placeholder="Enter video title" />
                    </div>
                    <div className="cd-field full">
                        <label className="cd-label">Description *</label>
                        <textarea className="cd-textarea" value={form.description} onChange={set('description')} placeholder="Describe your content..." />
                    </div>
                    <div className="cd-field">
                        <label className="cd-label">Genres</label>
                        <input className="cd-input" value={form.genres} onChange={set('genres')} placeholder="Action, Drama..." />
                    </div>
                    <div className="cd-field">
                        <label className="cd-label">Thumbnail URL</label>
                        <input className="cd-input" type="url" value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="cd-field">
                        <label className="cd-label">Release Year</label>
                        <input className="cd-input" type="number" value={form.releaseYear} onChange={set('releaseYear')} placeholder="2024" min="1900" max="2099" />
                    </div>
                    <div className="cd-field">
                        <label className="cd-label">Type</label>
                        <select className="cd-select" value={form.type} onChange={set('type')}>
                            {['Movie', 'TV Show', 'Series', 'Short', 'Documentary'].map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="cd-field">
                        <label className="cd-label">Required Plan</label>
                        <select className="cd-select" value={form.plan} onChange={set('plan')}>
                            {['Basic', 'Standard', 'Premium'].map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                <button className="cd-btn cd-btn-primary" type="submit" disabled={loading}>
                    {loading ? (videoOption === 'file' ? `Uploading ${progress}%...` : 'Saving...') : 'Publish Video'}
                </button>
            </form>
        </div>
    );
}

function VideoCard({ video, onDelete }) {
    const status = video.status || 'pending';
    const date = video.createdAt ? new Date(video.createdAt).toLocaleDateString() : '';
    return (
        <div className="cd-card">
            <div className="cd-card__thumb">
                {video.thumbnailUrl
                    ? <img src={video.thumbnailUrl} alt={video.title} />
                    : <div className="cd-card__thumb-placeholder">🎬</div>
                }
                <span className={`cd-card__badge ${status}`}>{status}</span>
            </div>
            <div className="cd-card__body">
                <div className="cd-card__title">{video.title}</div>
                <div className="cd-card__meta">{video.type || 'Video'} · {date}</div>
                <div className="cd-card__actions">
                    <button className="cd-btn-sm cd-btn-ghost" onClick={() => window.open(`/#/watch/${video._id}`, '_blank')}>Watch</button>
                    <button className="cd-btn-sm cd-btn-danger" onClick={() => onDelete(video._id)}>Delete</button>
                </div>
            </div>
        </div>
    );
}

function VideosSection({ videos, loading, onDelete }) {
    const [filter, setFilter] = useState('all');
    const filtered = filter === 'all' ? videos : videos.filter(v => (v.status || 'pending') === filter);
    return (
        <div>
            <div className="cd-filter-bar">
                {['all', 'approved', 'pending', 'rejected'].map(f => (
                    <button key={f} className={`cd-filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f !== 'all' && ` (${videos.filter(v => (v.status || 'pending') === f).length})`}
                    </button>
                ))}
            </div>
            {loading ? (
                <div className="cd-empty"><div className="cd-empty__icon">⏳</div>Loading videos...</div>
            ) : filtered.length === 0 ? (
                <div className="cd-empty">
                    <div className="cd-empty__icon">📭</div>
                    No {filter === 'all' ? '' : filter} videos yet.
                </div>
            ) : (
                <div className="cd-grid">
                    {filtered.map(v => <VideoCard key={v._id} video={v} onDelete={onDelete} />)}
                </div>
            )}
        </div>
    );
}

export default function CreatorDashboard() {
    const { user, email } = useAuth();
    const [tab, setTab] = useState('overview');
    const [videos, setVideos] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(true);

    const fetchVideos = useCallback(async () => {
        if (!email) return;
        setLoadingVideos(true);
        try {
            setVideos(await getVideosByUser(email));
        } catch {
            setVideos([]);
        } finally {
            setLoadingVideos(false);
        }
    }, [email]);

    useEffect(() => { fetchVideos(); }, [fetchVideos]);

    async function handleDelete(id) {
        if (!window.confirm('Delete this video?')) return;
        try {
            await deleteVideo(id);
            setVideos(prev => prev.filter(v => v._id !== id));
        } catch {}
    }

    const approved = videos.filter(v => v.status === 'approved').length;
    const pending  = videos.filter(v => (v.status || 'pending') === 'pending').length;
    const rejected = videos.filter(v => v.status === 'rejected').length;

    return (
        <div className="cd-root">
            <Sidebar active={tab} onNav={setTab} user={user} />
            <main className="cd-main">
                {tab === 'overview' && (
                    <div>
                        <div className="cd-header">
                            <h1>Welcome back, {user?.username?.split(' ')[0] || 'Creator'}</h1>
                            <p>Here is a snapshot of your content performance.</p>
                        </div>
                        <div className="cd-stats">
                            <StatCard label="Total Videos" value={videos.length} />
                            <StatCard label="Approved"     value={approved} color="green" />
                            <StatCard label="Pending"      value={pending}  color="yellow" />
                            <StatCard label="Rejected"     value={rejected} color="red" />
                        </div>
                        <div className="cd-section">
                            <div className="cd-section__title">Recent Uploads</div>
                            {videos.length === 0 ? (
                                <div className="cd-empty">
                                    <div className="cd-empty__icon">🎬</div>
                                    No videos yet. Start by uploading one.
                                </div>
                            ) : (
                                <div className="cd-grid">
                                    {videos.slice(0, 4).map(v => <VideoCard key={v._id} video={v} onDelete={handleDelete} />)}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'upload' && (
                    <div>
                        <div className="cd-header">
                            <h1>Upload Content</h1>
                            <p>Share your work with the world.</p>
                        </div>
                        <div className="cd-section">
                            <UploadSection onUploaded={() => { fetchVideos(); setTab('videos'); }} />
                        </div>
                    </div>
                )}

                {tab === 'videos' && (
                    <div>
                        <div className="cd-header">
                            <h1>My Videos</h1>
                            <p>Manage and track all your uploaded content.</p>
                        </div>
                        <div className="cd-section">
                            <VideosSection videos={videos} loading={loadingVideos} onDelete={handleDelete} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
