import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../css/navbar.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const aiRef = useRef(null);

    const [token, setToken] = useState(localStorage.getItem('token'));
    const [myEmail, setMyEmail] = useState(localStorage.getItem('email'));
    const [avatar, setAvatar] = useState(null);
    const [search, setSearch] = useState('');
    const [aiOpen, setAiOpen] = useState(false);

    const isAiActive = location.pathname === '/ai-script' || location.pathname === '/ai-analyze';

    useEffect(() => {
        const sync = () => {
            setToken(localStorage.getItem('token'));
            setMyEmail(localStorage.getItem('email'));
        };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    useEffect(() => {
        if (!myEmail || !token) { setAvatar(null); return; }
        axios.get(`${API}/api/v1/users/${encodeURIComponent(myEmail)}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => { if (res.data.success) setAvatar(res.data.data.avatar || null); })
            .catch(() => {});
    }, [myEmail, token]);

    useEffect(() => {
        const close = (e) => {
            if (aiRef.current && !aiRef.current.contains(e.target)) setAiOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => { setAiOpen(false); }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        setToken(null);
        setMyEmail(null);
        setAvatar(null);
        navigate('/login');
    };

    const submitSearch = () => {
        if (search.trim()) navigate(`/search?query=${encodeURIComponent(search.trim())}`);
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                <span className="logo-text">streamer</span>
            </Link>

            <div className="navbar-links">
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : undefined}>Home</NavLink>
                <NavLink to="/movies" className={({ isActive }) => isActive ? 'active' : undefined}>Movies</NavLink>
                <NavLink to="/upload" className={({ isActive }) => isActive ? 'active' : undefined}>Upload</NavLink>

                <div className={`nav-dropdown-wrap ${isAiActive ? 'ai-nav-active' : ''}`} ref={aiRef}>
                    <button
                        className={`nav-dropdown-trigger ${isAiActive ? 'active' : ''} ${aiOpen ? 'open' : ''}`}
                        onClick={() => setAiOpen(v => !v)}
                    >
                        <span className="nav-ai-dot" />
                        AI Tools
                        <svg className={`nav-chevron ${aiOpen ? 'flipped' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {aiOpen && (
                        <div className="nav-dropdown-panel">
                            <div className="nav-dropdown-header">AI Studio</div>
                            <Link to="/ai-script" className="nav-dropdown-item" onClick={() => setAiOpen(false)}>
                                <div className="nav-dropdown-icon writer">✦</div>
                                <div className="nav-dropdown-text">
                                    <span className="nav-dropdown-title">Script Writer</span>
                                    <span className="nav-dropdown-desc">Generate scripts from your ideas</span>
                                </div>
                            </Link>
                            <Link to="/ai-analyze" className="nav-dropdown-item" onClick={() => setAiOpen(false)}>
                                <div className="nav-dropdown-icon analyzer">◈</div>
                                <div className="nav-dropdown-text">
                                    <span className="nav-dropdown-title">Script Analyser</span>
                                    <span className="nav-dropdown-desc">Critique & improve existing scripts</span>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="navbar-search">
                <input
                    type="text"
                    placeholder="Search movies..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitSearch()}
                    className="navbar-search-input"
                />
                <button className="navbar-search-btn" onClick={submitSearch} aria-label="Search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </button>
            </div>

            <div className="navbar-profile">
                {token && myEmail && (
                    <Link to={`/profile/${myEmail}`} className="navbar-avatar" title="My Profile">
                        {avatar
                            ? <img src={avatar} alt="avatar" className="navbar-avatar__img" />
                            : <span className="navbar-avatar__initials">{myEmail[0].toUpperCase()}</span>
                        }
                    </Link>
                )}
                {token
                    ? <button className="navbar-btn" onClick={handleLogout}>Logout</button>
                    : <Link to="/login" className="navbar-btn">Login</Link>
                }
            </div>
        </nav>
    );
}
