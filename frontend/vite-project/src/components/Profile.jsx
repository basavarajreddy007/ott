import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import MovieCard from './MovieCard';
import '../css/profile.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API, withCredentials: true });

const getLoggedInEmail = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1])).email || null;
    } catch {
        return localStorage.getItem('email') || null;
    }
};

const avatarFallback = (email) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&backgroundColor=0f172a&textColor=38bdf8`;

/* ─── Skeleton ─── */
function ProfileSkeleton() {
    return (
        <>
            <div className="profile-skeleton-header">
                <div className="skeleton skeleton-avatar" />
                <div className="skeleton-lines">
                    <div className="skeleton skeleton-line skeleton-line--title" />
                    <div className="skeleton skeleton-line skeleton-line--sub" />
                    <div className="skeleton skeleton-line skeleton-line--full" />
                    <div className="skeleton skeleton-line skeleton-line--half" />
                </div>
            </div>
            <div className="profile-skeleton-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton skeleton-card" />
                ))}
            </div>
        </>
    );
}

/* ─── Edit Modal ─── */
function EditModal({ user, onClose, onSave }) {
    const [form, setForm] = useState({
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(user.avatar || avatarFallback(user.email));

    const set = (key) => (e) => {
        setForm(f => ({ ...f, [key]: e.target.value }));
        if (key === 'avatar' && e.target.value.trim()) setPreview(e.target.value.trim());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await api.patch(`/api/v1/users/${user.email}`, form, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            onSave(res.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    // close on overlay click
    const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

    return (
        <div className="profile-modal-overlay" onClick={handleOverlay}>
            <div className="profile-modal" role="dialog" aria-modal="true" aria-label="Edit Profile">
                <button className="profile-modal__close" onClick={onClose} aria-label="Close">✕</button>
                <h2 className="profile-modal__title">Edit Profile</h2>

                {error && <div className="profile-modal-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="profile-modal-avatar-row">
                        <img
                            className="profile-modal-avatar-preview"
                            src={preview}
                            alt="Avatar preview"
                            onError={() => setPreview(avatarFallback(user.email))}
                        />
                        <div className="profile-modal-field" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="profile-modal-label">Avatar URL</label>
                            <input
                                className="profile-modal-input"
                                value={form.avatar}
                                onChange={set('avatar')}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="profile-modal-field">
                        <label className="profile-modal-label">Username</label>
                        <input
                            className="profile-modal-input"
                            value={form.username}
                            onChange={set('username')}
                            placeholder="Your display name"
                            maxLength={40}
                        />
                    </div>

                    <div className="profile-modal-field">
                        <label className="profile-modal-label">Bio</label>
                        <textarea
                            className="profile-modal-textarea"
                            value={form.bio}
                            onChange={set('bio')}
                            placeholder="Tell people a bit about yourself..."
                            maxLength={300}
                        />
                    </div>

                    <div className="profile-modal-actions">
                        <button type="button" className="profile-modal-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="profile-modal-save" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Profile Header ─── */
function ProfileHeader({ user, videos, isOwner, onEdit }) {
    const [bioExpanded, setBioExpanded] = useState(false);
    const hasBio = user.bio && user.bio.trim().length > 0;
    const bioLong = hasBio && user.bio.length > 120;

    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);

    return (
        <div className="profile-header">
            <div className="profile-header-inner">
                <div className="profile-avatar-wrap">
                    <img
                        className="profile-avatar"
                        src={user.avatar || avatarFallback(user.email)}
                        alt={user.username || user.email}
                        onError={(e) => { e.currentTarget.src = avatarFallback(user.email); }}
                    />
                </div>

                <div className="profile-info">
                    <h1 className="profile-name">{user.username || 'Unnamed User'}</h1>
                    <p className="profile-email">{user.email}</p>

                    <div className="profile-stats">
                        <div className="profile-stat">
                            <span className="profile-stat__value">{videos.length}</span>
                            <span className="profile-stat__label">Videos</span>
                        </div>
                        <div className="profile-stat">
                            <span className="profile-stat__value">{totalViews.toLocaleString()}</span>
                            <span className="profile-stat__label">Views</span>
                        </div>
                        <div className="profile-stat">
                            <span className="profile-stat__value">{user.followers ?? 0}</span>
                            <span className="profile-stat__label">Followers</span>
                        </div>
                    </div>

                    {hasBio ? (
                        <>
                            <p className={`profile-bio${bioLong && !bioExpanded ? ' profile-bio--clamped' : ''}`}>
                                {user.bio}
                            </p>
                            {bioLong && (
                                <button
                                    className="profile-bio-toggle"
                                    onClick={() => setBioExpanded(x => !x)}
                                >
                                    {bioExpanded ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </>
                    ) : (
                        <p className="profile-bio-empty">No bio yet.</p>
                    )}
                </div>

                <div className="profile-actions">
                    {isOwner ? (
                        <button className="profile-edit-btn" onClick={onEdit}>
                            Edit Profile
                        </button>
                    ) : (
                        <button className="profile-follow-btn">Follow</button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Profile Videos ─── */
function ProfileVideos({ videos, isOwner, username }) {
    if (videos.length === 0) {
        return (
            <div className="profile-videos">
                <div className="profile-videos-header">
                    <h2 className="profile-videos-title">
                        {isOwner ? 'My Videos' : `${username}'s Videos`}
                    </h2>
                </div>
                <div className="profile-empty-state">
                    <span className="profile-empty-state__icon">🎬</span>
                    <p>{isOwner ? "You haven't uploaded any videos yet." : "No videos uploaded yet."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-videos">
            <div className="profile-videos-header">
                <h2 className="profile-videos-title">
                    {isOwner ? 'My Videos' : `${username}'s Videos`}
                </h2>
                <span className="profile-videos-count">{videos.length}</span>
            </div>
            <div className="movie-grid">
                {videos.map(v => <MovieCard key={v._id} movie={v} />)}
            </div>
        </div>
    );
}

/* ─── Main ─── */
export default function Profile() {
    const { email } = useParams();

    const [user, setUser]       = useState(null);
    const [videos, setVideos]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [editing, setEditing] = useState(false);

    const myEmail = getLoggedInEmail();
    const isOwner = myEmail === decodeURIComponent(email);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [userRes, videosRes] = await Promise.all([
                api.get(`/api/v1/users/${email}`),
                api.get(`/api/v1/videos/user/${email}`),
            ]);
            setUser(userRes.data.data);
            setVideos(videosRes.data.data || []);
        } catch {
            setError('Failed to load profile. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [email]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleSave = (updated) => {
        setUser(updated);
        setEditing(false);
    };

    if (loading) return <div className="profile-page"><ProfileSkeleton /></div>;

    if (error) {
        return (
            <div className="profile-page">
                <div className="profile-error-state">
                    <p>{error}</p>
                    <button className="profile-retry-btn" onClick={fetchProfile}>Retry</button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="profile-page">
            <ProfileHeader
                user={user}
                videos={videos}
                isOwner={isOwner}
                onEdit={() => setEditing(true)}
            />
            <ProfileVideos
                videos={videos}
                isOwner={isOwner}
                username={user.username || user.email}
            />
            {editing && (
                <EditModal
                    user={user}
                    onClose={() => setEditing(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
