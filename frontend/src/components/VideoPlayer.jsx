import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import '../css/videoplayer.css';

export default function VideoPlayer() {
    const { id }      = useParams();
    const navigate    = useNavigate();
    const currentUser = useSelector(function(state) { return state.auth.user; });

    const [video, setVideo]           = useState(null);
    const [status, setStatus]         = useState('loading');
    const [liked, setLiked]           = useState(false);
    const [likes, setLikes]           = useState(0);
    const [comments, setComments]     = useState([]);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(function() {
        api.get(`/videos/${id}`)
            .then(function(res) {
                const v = res.data.data;
                setVideo(v);
                setLikes(v.likes || 0);
                setComments(v.comments || []);
                if (currentUser) {
                    const uid = currentUser._id && currentUser._id.toString();
                    setLiked(v.likedBy && v.likedBy.some(function(likeId) {
                        return likeId && likeId.toString() === uid;
                    }));
                }
                setStatus('ok');
            })
            .catch(function(err) {
                if (err.response && err.response.status === 403) {
                    setStatus('locked');
                    setVideo({ upgradeMessage: err.response.data.message });
                } else {
                    setStatus('error');
                }
            });
    }, [id, currentUser]);

    async function handleLike() {
        if (!currentUser) return alert('Please log in to like videos');
        const res = await api.post(`/videos/${id}/like`);
        setLiked(res.data.liked);
        setLikes(res.data.likes);
    }

    async function handleComment(e) {
        e.preventDefault();
        if (!currentUser) return alert('Please log in to comment');
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/videos/${id}/comments`, { text: commentText });
            setComments(function(prev) { return [...prev, res.data.data]; });
            setCommentText('');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteComment(commentId) {
        await api.delete(`/videos/${id}/comments/${commentId}`);
        setComments(function(prev) { return prev.filter(function(c) { return c._id !== commentId; }); });
    }

    function canDelete(comment) {
        if (!currentUser) return false;
        const userId = currentUser._id && currentUser._id.toString();
        const commentUserId = comment.user && comment.user.toString();
        return userId === commentUserId || currentUser.role === 'admin';
    }

    if (status === 'loading') {
        return <div className="video-player-container"><p>Loading…</p></div>;
    }

    if (status === 'locked') {
        const isAdmin = currentUser?.role === 'admin';
        if (isAdmin) {
            // Admin can watch anything — reload without lock
            api.get(`/videos/${id}`, { headers: { 'x-admin-override': '1' } })
                .then(function(res) {
                    const v = res.data.data;
                    setVideo(v);
                    setLikes(v.likes || 0);
                    setComments(v.comments || []);
                    setStatus('ok');
                })
                .catch(function() { setStatus('error'); });
            return <div className="video-player-container"><p style={{color:'var(--text-3)',padding:'40px'}}>Loading…</p></div>;
        }
        return (
            <div className="video-player-container">
                <button className="back-button" onClick={function() { navigate('/'); }}>← Back</button>
                <div className="vp-locked">
                    <span className="vp-locked__icon">🔒</span>
                    <h2>Plan Required</h2>
                    <p>{video.upgradeMessage}</p>
                    <button className="vp-upgrade-btn" onClick={function() { navigate('/payment'); }}>Upgrade Plan</button>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="video-player-container">
                <p>Failed to load video.</p>
                <button onClick={function() { navigate('/'); }}>← Go Home</button>
            </div>
        );
    }

    return (
        <div className="video-player-container">
            <button className="back-button" onClick={function() { navigate('/'); }}>← Back</button>

            <div className="video-wrapper">
                <video key={video.videoUrl} controls autoPlay preload="metadata" playsInline crossOrigin="anonymous" className="styled-video" poster={video.thumbnailUrl}>
                    <source src={video.videoUrl} type="video/mp4" />
                </video>
            </div>

            <div className="video-details">
                <div className="video-title-row">
                    <h1>{video.title}</h1>
                    <button className={`action-btn like-btn${liked ? ' active' : ''}`} onClick={handleLike}>
                        {liked ? '❤️' : '🤍'} {likes}
                    </button>
                </div>
                <p className="video-description">{video.description || 'No description available'}</p>
                <div className="video-meta">
                    {video.genres && video.genres.map(function(g) { return <span key={g} className="video-meta__tag">{g}</span>; })}
                    {video.releaseYear && <span>{video.releaseYear}</span>}
                    <span>{(video.views || 0).toLocaleString()} views</span>
                </div>
            </div>

            <div className="comments-section">
                <h2 className="comments-title">
                    Comments <span className="comments-title__count">{comments.length}</span>
                </h2>

                {currentUser && (
                    <form className="comment-form" onSubmit={handleComment}>
                        <input
                            type="text"
                            className="comment-input"
                            placeholder="Add a comment…"
                            value={commentText}
                            onChange={function(e) { setCommentText(e.target.value); }}
                            maxLength={500}
                        />
                        <button type="submit" className="comment-submit" disabled={submitting || !commentText.trim()}>
                            {submitting ? 'Posting…' : 'Post'}
                        </button>
                    </form>
                )}

                <div className="comments-list">
                    {comments.length === 0 && <p className="no-comments">No comments yet.</p>}
                    {[...comments].reverse().map(function(c) {
                        return (
                            <div key={c._id} className="comment-item">
                                <div className="comment-body">
                                    <div className="comment-header">
                                        <span className="comment-username">{c.username}</span>
                                        <span className="comment-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="comment-text">{c.text}</p>
                                </div>
                                {canDelete(c) && (
                                    <button className="comment-delete" onClick={function() { handleDeleteComment(c._id); }}>✕</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
