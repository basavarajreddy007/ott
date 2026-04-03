import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser as updateUserStore } from '../store/index.js';
import { getVideosByUser, updateVideo, deleteVideo } from '../services/videoService';
import { getUser, updateUser } from '../services/userService';
import '../css/dashboard.css';

const avatarFallback = email =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&backgroundColor=0f172a&textColor=38bdf8`;

export default function Dashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const email = useSelector(s => s.auth.email);

    const [user, setUser] = useState(null);
    const [videos, setVideos] = useState([]);
    const [status, setStatus] = useState('loading'); // loading | error | ok
    const [tab, setTab] = useState('videos');
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // null | { type, video? }
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!email) { setStatus('ok'); return; }
        Promise.all([getUser(email), getVideosByUser(email)])
            .then(([u, v]) => { setUser(u); setVideos(v); setStatus('ok'); })
            .catch(() => setStatus('error'));
    }, [email]);

    function openEdit(video) {
        setForm({ title: video.title || '', description: video.description || '', genres: (video.genres || []).join(', '), releaseYear: video.releaseYear || '', type: video.type || 'Movie' });
        setError('');
        setModal({ type: 'edit', video });
    }

    function openProfile() {
        setForm({ username: user.username || '', bio: user.bio || '', avatar: user.avatar || '' });
        setError('');
        setModal({ type: 'profile' });
    }

    function closeModal() { setModal(null); setError(''); }

    async function saveEdit(e) {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const updated = await updateVideo(modal.video._id, {
                ...form,
                genres: form.genres.split(',').map(g => g.trim()).filter(Boolean),
                releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined
            });
            setVideos(vs => vs.map(v => v._id === updated._id ? updated : v));
            closeModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Update failed');
        } finally { setSaving(false); }
    }

    async function confirmDelete() {
        setSaving(true); setError('');
        try {
            await deleteVideo(modal.video._id);
            setVideos(vs => vs.filter(v => v._id !== modal.video._id));
            closeModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed');
        } finally { setSaving(false); }
    }

    async function saveProfile(e) {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const updated = await updateUser(email, form);
            setUser(prev => ({ ...prev, ...updated }));
            dispatch(updateUserStore(updated));
            localStorage.setItem('user', JSON.stringify(updated));
            closeModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Update failed');
        } finally { setSaving(false); }
    }

    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
    const filtered = videos.filter(v => !search.trim() || v.title.toLowerCase().includes(search.toLowerCase()));
    const field = (key, type = 'input', opts = {}) => {
        const Tag = type;
        return <Tag className={`db-${type}`} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} {...opts} />;
    };

    if (status === 'loading') return <div className="db-page"><div className="db-loading"><div className="db-loading__spinner" /><span>Loading…</span></div></div>;
    if (status === 'error') return <div className="db-page"><div className="db-loading"><p style={{ color: '#fca5a5' }}>Failed to load dashboard.</p><button className="db-btn db-btn--ghost" onClick={() => navigate('/login')}>Back to Login</button></div></div>;
    if (!user) return <div className="db-page"><div className="db-loading"><p>User not found.</p><button className="db-btn db-btn--ghost" onClick={() => navigate('/')}>Go Home</button></div></div>;

    return (
        <div className="db-page">
            <aside className="db-sidebar">
                <div className="db-sidebar__profile">
                    <img className="db-sidebar__avatar" src={user.avatar || avatarFallback(user.email)} alt={user.username} onError={e => { e.currentTarget.src = avatarFallback(user.email); }} />
                    <div className="db-sidebar__info">
                        <p className="db-sidebar__name">{user.username || 'User'}</p>
                        <p className="db-sidebar__email">{user.email}</p>
                    </div>
                </div>
                <nav className="db-sidebar__nav">
                    <button className={`db-nav-item${tab === 'videos' ? ' active' : ''}`} onClick={() => setTab('videos')}>My Videos <span className="db-nav-badge">{videos.length}</span></button>
                    <button className={`db-nav-item${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>Profile</button>
                    <button className="db-nav-item" onClick={() => navigate('/upload')}>Upload Video</button>
                    <button className="db-nav-item" onClick={() => navigate('/')}>Back to Home</button>
                </nav>
                <div className="db-sidebar__stats">
                    {[['Videos', videos.length], ['Views', totalViews.toLocaleString()], ['Followers', user.followers ?? 0]].map(([label, val]) => (
                        <div key={label} className="db-stat-card">
                            <span className="db-stat-card__val">{val}</span>
                            <span className="db-stat-card__label">{label}</span>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="db-main">
                {tab === 'videos' && (
                    <div>
                        <div className="db-section__head">
                            <div>
                                <h1 className="db-section__title">My Videos</h1>
                                <p className="db-section__sub">{videos.length} video{videos.length !== 1 ? 's' : ''} · {totalViews.toLocaleString()} views</p>
                            </div>
                            <button className="db-btn db-btn--primary" onClick={() => navigate('/upload')}>+ Upload</button>
                        </div>
                        <div className="db-search-bar">
                            <input className="db-search-input" placeholder="Search videos…" value={search} onChange={e => setSearch(e.target.value)} />
                            {search && <button className="db-search-clear" onClick={() => setSearch('')}>✕</button>}
                        </div>
                        {filtered.length === 0
                            ? <div className="db-empty"><span>🎬</span><p>{search ? `No results for "${search}"` : 'No videos yet.'}</p></div>
                            : <div className="db-video-list">{filtered.map(v => (
                                <div key={v._id} className="db-video-row">
                                    <div className="db-video-thumb" onClick={() => navigate(`/watch/${v._id}`)}>
                                        {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt={v.title} /> : <div className="db-video-thumb__placeholder">🎬</div>}
                                        <div className="db-video-thumb__play">▶</div>
                                    </div>
                                    <div className="db-video-info">
                                        <p className="db-video-title">{v.title}</p>
                                        <div className="db-video-meta">
                                            {v.type && <span className="db-tag">{v.type}</span>}
                                            {(v.genres || []).slice(0, 2).map(g => <span key={g} className="db-tag db-tag--genre">{g}</span>)}
                                            {v.releaseYear && <span className="db-video-year">{v.releaseYear}</span>}
                                        </div>
                                        <div className="db-video-stats">
                                            <span>{(v.views || 0).toLocaleString()} views</span>
                                            {v.duration > 0 && <span>{Math.floor(v.duration / 60)}m {v.duration % 60}s</span>}
                                        </div>
                                    </div>
                                    <div className="db-video-actions">
                                        <button className="db-action-btn db-action-btn--edit" onClick={() => openEdit(v)}>Edit</button>
                                        <button className="db-action-btn db-action-btn--delete" onClick={() => { setError(''); setModal({ type: 'delete', video: v }); }}>Delete</button>
                                    </div>
                                </div>
                            ))}</div>
                        }
                    </div>
                )}

                {tab === 'profile' && (
                    <div>
                        <div className="db-section__head">
                            <div>
                                <h1 className="db-section__title">Profile</h1>
                                <p className="db-section__sub">Manage your public profile</p>
                            </div>
                            <button className="db-btn db-btn--primary" onClick={openProfile}>Edit Profile</button>
                        </div>
                        <div className="db-profile-card">
                            <img className="db-profile-card__avatar" src={user.avatar || avatarFallback(user.email)} alt={user.username} onError={e => { e.currentTarget.src = avatarFallback(user.email); }} />
                            <div className="db-profile-card__info">
                                <h2 className="db-profile-card__name">{user.username || 'Unnamed User'}</h2>
                                <p className="db-profile-card__email">{user.email}</p>
                                <p className="db-profile-card__bio">{user.bio || <em>No bio yet.</em>}</p>
                            </div>
                        </div>
                        <div className="db-profile-stats">
                            {[['Videos', videos.length], ['Total Views', totalViews.toLocaleString()], ['Followers', user.followers ?? 0]].map(([label, val]) => (
                                <div key={label} className="db-profile-stat">
                                    <span className="db-profile-stat__val">{val}</span>
                                    <span className="db-profile-stat__label">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {modal?.type === 'edit' && (
                <div className="db-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="db-modal" role="dialog" aria-modal="true">
                        <button className="db-modal__close" onClick={closeModal}>✕</button>
                        <h2 className="db-modal__title" style={{ marginBottom: 20 }}>Edit — {modal.video.title}</h2>
                        {error && <div className="db-alert db-alert--error">{error}</div>}
                        <form onSubmit={saveEdit}>
                            <div className="db-field"><label className="db-label">Title</label>{field('title', 'input', { required: true })}</div>
                            <div className="db-field"><label className="db-label">Description</label>{field('description', 'textarea', { rows: 3 })}</div>
                            <div className="db-row2">
                                <div className="db-field">
                                    <label className="db-label">Type</label>
                                    <select className="db-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                        {['Movie', 'Series', 'Short', 'Documentary'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="db-field"><label className="db-label">Release Year</label>{field('releaseYear', 'input', { type: 'number', min: 1900, max: 2099 })}</div>
                            </div>
                            <div className="db-field"><label className="db-label">Genres</label>{field('genres', 'input', { placeholder: 'Action, Drama' })}</div>
                            <div className="db-modal__actions">
                                <button type="button" className="db-btn db-btn--ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="db-btn db-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal?.type === 'delete' && (
                <div className="db-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="db-modal" role="dialog" aria-modal="true" style={{ textAlign: 'center' }}>
                        <button className="db-modal__close" onClick={closeModal}>✕</button>
                        <div className="db-delete-icon">🗑</div>
                        <h2 className="db-modal__title">Delete Video?</h2>
                        <p className="db-delete-desc">"{modal.video.title}" will be permanently removed.</p>
                        {error && <div className="db-alert db-alert--error">{error}</div>}
                        <div className="db-modal__actions">
                            <button className="db-btn db-btn--ghost" onClick={closeModal}>Cancel</button>
                            <button className="db-btn db-btn--danger" onClick={confirmDelete} disabled={saving}>{saving ? 'Deleting…' : 'Yes, Delete'}</button>
                        </div>
                    </div>
                </div>
            )}

            {modal?.type === 'profile' && (
                <div className="db-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="db-modal" role="dialog" aria-modal="true">
                        <button className="db-modal__close" onClick={closeModal}>✕</button>
                        <h2 className="db-modal__title" style={{ marginBottom: 20 }}>Edit Profile</h2>
                        {error && <div className="db-alert db-alert--error">{error}</div>}
                        <form onSubmit={saveProfile}>
                            <div className="db-field"><label className="db-label">Avatar URL</label>{field('avatar', 'input', { placeholder: 'https://...' })}</div>
                            <div className="db-field"><label className="db-label">Username</label>{field('username', 'input', { maxLength: 40 })}</div>
                            <div className="db-field"><label className="db-label">Bio</label>{field('bio', 'textarea', { maxLength: 300, rows: 3 })}</div>
                            <div className="db-modal__actions">
                                <button type="button" className="db-btn db-btn--ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="db-btn db-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
