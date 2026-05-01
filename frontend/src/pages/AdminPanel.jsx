import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    getStats, getAllUsers, updateUserRole, updateUserPlan, deleteUser,
    getAllVideos, updateAdminVideo, deleteVideo, getAllRequests, deleteRequest
} from '../services/adminService';
import '../css/admin.css';

const TABS = ['Overview', 'Users', 'Videos', 'Requests'];

function StatCard({ label, value, icon, color, onClick }) {
    return (
        <div
            className={`adm-stat-card adm-stat-card--${color}${onClick ? ' adm-stat-card--clickable' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? function(e) { if (e.key === 'Enter') onClick(); } : undefined}
        >
            <div className="adm-stat-icon">{icon}</div>
            <div className="adm-stat-body">
                <span className="adm-stat-val">{value}</span>
                <span className="adm-stat-label">{label}</span>
            </div>
            {onClick && <span className="adm-stat-arrow">→</span>}
        </div>
    );
}

function Confirm({ message, onConfirm, onCancel }) {
    return (
        <div className="adm-overlay" onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="adm-confirm">
                <div className="adm-confirm-icon">⚠️</div>
                <p className="adm-confirm-msg">{message}</p>
                <div className="adm-confirm-actions">
                    <button className="adm-btn adm-btn--ghost" onClick={onCancel}>Cancel</button>
                    <button className="adm-btn adm-btn--danger" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
}

function VideoEditModal({ video, onSave, onClose }) {
    const [form, setForm] = useState({
        title:       video.title || '',
        description: video.description || '',
        genres:      (video.genres || []).join(', '),
        releaseYear: video.releaseYear || '',
        type:        video.type || 'Movie',
        requiredPlan: video.requiredPlan || 'Basic',
        featured:    video.featured || false
    });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    function set(key) {
        return function(e) {
            const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            setForm(function(prev) { return { ...prev, [key]: val }; });
        };
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const updated = await updateAdminVideo(video._id, form);
            onSave(updated);
        } catch (err) {
            setError(err.response?.data?.error || 'Update failed');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="adm-overlay" onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
            <div className="adm-modal">
                <div className="adm-modal-header">
                    <h2 className="adm-modal-title">Edit Video</h2>
                    <button className="adm-modal-close" onClick={onClose}>✕</button>
                </div>

                {video.thumbnailUrl && (
                    <div className="adm-modal-thumb">
                        <img src={video.thumbnailUrl} alt={video.title} />
                        <div className="adm-modal-thumb-overlay">
                            <span className="adm-modal-thumb-title">{video.title}</span>
                        </div>
                    </div>
                )}

                {error && <div className="adm-modal-error">{error}</div>}

                <form onSubmit={handleSave} className="adm-modal-form">
                    <div className="adm-modal-field">
                        <label>Title</label>
                        <input className="adm-modal-input" value={form.title} onChange={set('title')} required />
                    </div>

                    <div className="adm-modal-field">
                        <label>Description</label>
                        <textarea className="adm-modal-textarea" value={form.description} onChange={set('description')} rows={3} />
                    </div>

                    <div className="adm-modal-row">
                        <div className="adm-modal-field">
                            <label>Type</label>
                            <select className="adm-modal-select" value={form.type} onChange={set('type')}>
                                {['Movie', 'Series', 'Short', 'Documentary', 'TV Show'].map(function(t) {
                                    return <option key={t}>{t}</option>;
                                })}
                            </select>
                        </div>
                        <div className="adm-modal-field">
                            <label>Required Plan</label>
                            <select className="adm-modal-select" value={form.requiredPlan} onChange={set('requiredPlan')}>
                                {['Basic', 'Standard', 'Premium'].map(function(p) {
                                    return <option key={p}>{p}</option>;
                                })}
                            </select>
                        </div>
                        <div className="adm-modal-field">
                            <label>Release Year</label>
                            <input className="adm-modal-input" type="number" value={form.releaseYear} onChange={set('releaseYear')} min={1900} max={2099} />
                        </div>
                    </div>

                    <div className="adm-modal-field">
                        <label>Genres <span className="adm-modal-hint">(comma separated)</span></label>
                        <input className="adm-modal-input" value={form.genres} onChange={set('genres')} placeholder="Action, Drama, Thriller" />
                    </div>

                    <div className="adm-modal-toggle">
                        <label className="adm-toggle-label">
                            <input type="checkbox" checked={form.featured} onChange={set('featured')} className="adm-toggle-input" />
                            <span className="adm-toggle-track">
                                <span className="adm-toggle-thumb" />
                            </span>
                            <span className="adm-toggle-text">
                                {form.featured ? '⭐ Featured on homepage' : 'Not featured'}
                            </span>
                        </label>
                    </div>

                    <div className="adm-modal-actions">
                        <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminPanel() {
    const navigate = useNavigate();
    const user = useSelector(function(s) { return s.auth.user; });

    const [tab, setTab]           = useState('Overview');
    const [stats, setStats]       = useState(null);
    const [users, setUsers]       = useState([]);
    const [videos, setVideos]     = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [confirm, setConfirm]   = useState(null);
    const [editVideo, setEditVideo] = useState(null);
    const [search, setSearch]     = useState('');

    useEffect(function() {
        if (!user || user.role !== 'admin') navigate('/', { replace: true });
    }, [user, navigate]);

    useEffect(function() {
        setLoading(true);
        Promise.all([getStats(), getAllVideos(), getAllRequests(), getAllUsers()])
            .then(function([s, v, r, u]) {
                setStats(s);
                setVideos(v);
                setRequests(r);
                setUsers(u);
            })
            .finally(function() { setLoading(false); });
    }, []);

    function handleDeleteUser(id) {
        setConfirm({
            message: 'Permanently delete this user and all their data?',
            onConfirm: async function() {
                await deleteUser(id);
                setUsers(function(prev) { return prev.filter(function(u) { return u._id !== id; }); });
                setConfirm(null);
            }
        });
    }

    function handleDeleteVideo(id, title) {
        setConfirm({
            message: `Permanently delete "${title}"?`,
            onConfirm: async function() {
                await deleteVideo(id);
                setVideos(function(prev) { return prev.filter(function(v) { return v._id !== id; }); });
                setConfirm(null);
            }
        });
    }

    function handleDeleteRequest(id) {
        setConfirm({
            message: 'Delete this request?',
            onConfirm: async function() {
                await deleteRequest(id);
                setRequests(function(prev) { return prev.filter(function(r) { return r._id !== id; }); });
                setConfirm(null);
            }
        });
    }

    async function handleRoleChange(id, role) {
        const updated = await updateUserRole(id, role);
        setUsers(function(prev) { return prev.map(function(u) { return u._id === id ? { ...u, role: updated.role } : u; }); });
    }

    async function handlePlanChange(id, plan) {
        const updated = await updateUserPlan(id, plan);
        setUsers(function(prev) { return prev.map(function(u) { return u._id === id ? { ...u, plan: updated.plan } : u; }); });
    }

    async function handleFeatureToggle(id, current) {
        const updated = await updateAdminVideo(id, { featured: !current });
        setVideos(function(prev) { return prev.map(function(v) { return v._id === id ? { ...v, featured: updated.featured } : v; }); });
    }

    function handleVideoSaved(updated) {
        setVideos(function(prev) { return prev.map(function(v) { return v._id === updated._id ? updated : v; }); });
        setEditVideo(null);
    }

    const filteredUsers  = users.filter(function(u) { return u.email.toLowerCase().includes(search.toLowerCase()) || (u.username || '').toLowerCase().includes(search.toLowerCase()); });
    const filteredVideos = videos.filter(function(v) { return (v.title || '').toLowerCase().includes(search.toLowerCase()); });
    const filteredReqs   = requests.filter(function(r) { return r.title.toLowerCase().includes(search.toLowerCase()); });

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="adm-page">
            <aside className="adm-sidebar">
                <div className="adm-sidebar-brand">
                    <span className="adm-brand-icon">⚡</span>
                    <span className="adm-brand-text">Admin Panel</span>
                </div>
                <nav className="adm-nav">
                    {TABS.map(function(t) {
                        const icons = { Overview: '📊', Users: '👥', Videos: '🎬', Requests: '📋' };
                        return (
                            <button key={t} className={`adm-nav-item${tab === t ? ' active' : ''}`} onClick={function() { setTab(t); }}>
                                <span className="adm-nav-icon">{icons[t]}</span>
                                {t}
                                {t === 'Videos'   && <span className="adm-nav-count">{videos.length || ''}</span>}
                                {t === 'Users'    && <span className="adm-nav-count">{users.length || ''}</span>}
                                {t === 'Requests' && <span className="adm-nav-count">{requests.length || ''}</span>}
                            </button>
                        );
                    })}
                </nav>
                <div className="adm-sidebar-footer">
                    <div className="adm-admin-badge">
                        <span className="adm-admin-dot" />
                        Super Admin
                    </div>
                    <button className="adm-btn adm-btn--ghost adm-back-btn" onClick={function() { navigate('/'); }}>
                        ← Back to Site
                    </button>
                </div>
            </aside>

            <main className="adm-main">
                <div className="adm-topbar">
                    <div>
                        <h1 className="adm-page-title">{tab}</h1>
                        <p className="adm-page-sub">
                            {tab === 'Overview' && 'Platform statistics at a glance'}
                            {tab === 'Users'    && `${users.length} registered users`}
                            {tab === 'Videos'   && `${videos.length} uploaded videos · ${videos.filter(function(v) { return v.featured; }).length} featured`}
                            {tab === 'Requests' && `${requests.length} community requests`}
                        </p>
                    </div>
                    {tab !== 'Overview' && (
                        <input
                            className="adm-search"
                            placeholder={`Search ${tab.toLowerCase()}...`}
                            value={search}
                            onChange={function(e) { setSearch(e.target.value); }}
                        />
                    )}
                </div>

                {loading && <div className="adm-loading"><div className="adm-spinner" /></div>}

                {!loading && tab === 'Overview' && stats && (
                    <div className="adm-overview">
                        <div className="adm-stats-grid">
                            <StatCard label="Total Users"   value={stats.totalUsers}    icon="👥" color="blue"    onClick={function() { setTab('Users'); }} />
                            <StatCard label="Total Videos"  value={stats.totalVideos}   icon="🎬" color="red"     onClick={function() { setTab('Videos'); }} />
                            <StatCard label="Requests"      value={stats.totalRequests} icon="📋" color="gold"    onClick={function() { setTab('Requests'); }} />
                            <StatCard label="Premium Users" value={stats.premiumUsers}  icon="💎" color="emerald" />
                        </div>

                        {/* All Videos */}
                        <div className="adm-overview-section">
                            <div className="adm-overview-section-head">
                                <h3 className="adm-recent-title">All Videos <span className="adm-count-badge">{videos.length}</span></h3>
                                <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={function() { setTab('Videos'); }}>Manage →</button>
                            </div>
                            <div className="adm-table-wrap">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>Video</th>
                                            <th>Uploader</th>
                                            <th>Plan</th>
                                            <th>Stats</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {videos.map(function(v) {
                                            return (
                                                <tr key={v._id} className={v.featured ? 'adm-row--featured' : ''}>
                                                    <td>
                                                        <div className="adm-video-cell">
                                                            <div className="adm-video-thumb">
                                                                {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt={v.title} /> : <span>🎬</span>}
                                                            </div>
                                                            <div>
                                                                <span className="adm-video-title">{v.title}</span>
                                                                <span className="adm-video-type">{v.type} · {v.releaseYear || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="adm-uploader">
                                                            {v.createdBy && typeof v.createdBy === 'object' ? (
                                                                <>
                                                                    <span className="adm-uploader-name">{v.createdBy.username || v.createdBy.email.split('@')[0]}</span>
                                                                    <span className="adm-uploader-email">{v.createdBy.email}</span>
                                                                </>
                                                            ) : <span className="adm-date">—</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`adm-badge adm-badge--${v.requiredPlan === 'Premium' ? 'gold' : v.requiredPlan === 'Standard' ? 'blue' : 'gray'}`}>
                                                            {v.requiredPlan || 'Basic'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="adm-video-stats">
                                                            <span>👁 {(v.views || 0).toLocaleString()}</span>
                                                            <span>❤️ {v.likes || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="adm-actions">
                                                            <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={function() { navigate(`/watch/${v._id}`); }}>View</button>
                                                            <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={function() { handleDeleteVideo(v._id, v.title); }}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {videos.length === 0 && <div className="adm-empty">No videos yet.</div>}
                            </div>
                        </div>

                        {/* All Requests */}
                        <div className="adm-overview-section">
                            <div className="adm-overview-section-head">
                                <h3 className="adm-recent-title">All Requests <span className="adm-count-badge">{requests.length}</span></h3>
                                <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={function() { setTab('Requests'); }}>Manage →</button>
                            </div>
                            <div className="adm-table-wrap">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Title</th>
                                            <th>Requested By</th>
                                            <th>Votes</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map(function(r, i) {
                                            return (
                                                <tr key={r._id}>
                                                    <td className="adm-date">{i + 1}</td>
                                                    <td className="adm-req-title">{r.title}</td>
                                                    <td className="adm-date">{r.requestedBy}</td>
                                                    <td className="adm-date">{r.count || 1}</td>
                                                    <td className="adm-date">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                    <td>
                                                        <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={function() { handleDeleteRequest(r._id); }}>Delete</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {requests.length === 0 && <div className="adm-empty">No requests yet.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {!loading && tab === 'Users' && (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Plan</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(function(u) {
                                    const isSuperAdmin = u.email === 'basavarajreddy000@gmail.com';
                                    return (
                                        <tr key={u._id}>
                                            <td>
                                                <div className="adm-user-cell">
                                                    <div className="adm-user-avatar">
                                                        {u.avatar ? <img src={u.avatar} alt={u.username} /> : <span>{u.email[0].toUpperCase()}</span>}
                                                    </div>
                                                    <div>
                                                        <div className="adm-user-name">
                                                            {u.username || '—'}
                                                            {isSuperAdmin && <span className="adm-super-badge">⚡ Super</span>}
                                                        </div>
                                                        <div className="adm-user-email">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <select className="adm-select" value={u.plan || 'none'} onChange={function(e) { handlePlanChange(u._id, e.target.value); }}>
                                                    {['none', 'Basic', 'Standard', 'Premium'].map(function(p) { return <option key={p} value={p}>{p}</option>; })}
                                                </select>
                                            </td>
                                            <td>
                                                <select className="adm-select" value={u.role} onChange={function(e) { handleRoleChange(u._id, e.target.value); }} disabled={isSuperAdmin}>
                                                    <option value="user">user</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            </td>
                                            <td className="adm-date">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td>
                                                <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={function() { handleDeleteUser(u._id); }} disabled={isSuperAdmin}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && <div className="adm-empty">No users found.</div>}
                    </div>
                )}

                {!loading && tab === 'Videos' && (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Video</th>
                                    <th>Uploader</th>
                                    <th>Plan</th>
                                    <th>Stats</th>
                                    <th>Featured</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVideos.map(function(v) {
                                    return (
                                        <tr key={v._id} className={v.featured ? 'adm-row--featured' : ''}>
                                            <td>
                                                <div className="adm-video-cell">
                                                    <div className="adm-video-thumb">
                                                        {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt={v.title} /> : <span>🎬</span>}
                                                    </div>
                                                    <div>
                                                        <span className="adm-video-title">{v.title}</span>
                                                        <span className="adm-video-type">{v.type} · {v.releaseYear || '—'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="adm-uploader">
                                                    {v.createdBy && typeof v.createdBy === 'object' ? (
                                                        <>
                                                            <span className="adm-uploader-name">{v.createdBy.username || v.createdBy.email.split('@')[0]}</span>
                                                            <span className="adm-uploader-email">{v.createdBy.email}</span>
                                                        </>
                                                    ) : <span className="adm-date">—</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`adm-badge adm-badge--${v.requiredPlan === 'Premium' ? 'gold' : v.requiredPlan === 'Standard' ? 'blue' : 'gray'}`}>
                                                    {v.requiredPlan || 'Basic'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="adm-video-stats">
                                                    <span>👁 {(v.views || 0).toLocaleString()}</span>
                                                    <span>❤️ {v.likes || 0}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className={`adm-feature-btn${v.featured ? ' adm-feature-btn--on' : ''}`}
                                                    onClick={function() { handleFeatureToggle(v._id, v.featured); }}
                                                    title={v.featured ? 'Remove from featured' : 'Feature this video'}
                                                >
                                                    {v.featured ? '⭐ Featured' : '☆ Feature'}
                                                </button>
                                            </td>
                                            <td>
                                                <div className="adm-actions">
                                                    <button className="adm-btn adm-btn--edit adm-btn--sm" onClick={function() { setEditVideo(v); }}>Edit</button>
                                                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={function() { navigate(`/watch/${v._id}`); }}>View</button>
                                                    <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={function() { handleDeleteVideo(v._id, v.title); }}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredVideos.length === 0 && <div className="adm-empty">No videos found.</div>}
                    </div>
                )}

                {!loading && tab === 'Requests' && (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Requested By</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReqs.map(function(r, i) {
                                    return (
                                        <tr key={r._id}>
                                            <td className="adm-date">{i + 1}</td>
                                            <td className="adm-req-title">{r.title}</td>
                                            <td className="adm-date">{r.requestedBy}</td>
                                            <td className="adm-date">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td>
                                                <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={function() { handleDeleteRequest(r._id); }}>Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredReqs.length === 0 && <div className="adm-empty">No requests found.</div>}
                    </div>
                )}
            </main>

            {confirm && (
                <Confirm message={confirm.message} onConfirm={confirm.onConfirm} onCancel={function() { setConfirm(null); }} />
            )}

            {editVideo && (
                <VideoEditModal video={editVideo} onSave={handleVideoSaved} onClose={function() { setEditVideo(null); }} />
            )}
        </div>
    );
}
