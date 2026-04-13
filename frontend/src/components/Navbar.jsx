import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../store/index.js';
import '../css/navbar.css';

export default function Navbar() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token, email, user } = useSelector(s => s.auth);
    const [search, setSearch] = useState('');

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('user');
        dispatch(clearUser());
        navigate('/login');
    }

    function handleSearch() {
        const val = search.trim();
        if (val) navigate(`/search?query=${encodeURIComponent(val)}`);
    }

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                <span className="logo-text">streamer</span>
            </Link>

            <div className="navbar-links">
                <NavLink to="/" end>Home</NavLink>
                <NavLink to="/movies">Movies</NavLink>
                <NavLink to="/upload">Upload</NavLink>
                <NavLink to="/ai-script">Script Writer</NavLink>
                <NavLink to="/ai-analyze">Script Analyser</NavLink>
                {token && <NavLink to="/dashboard">Dashboard</NavLink>}
                {token && <NavLink to="/payment" className="navbar-subscribe-link">Subscribe</NavLink>}
            </div>

            <div className="navbar-search">
                <input
                    type="text"
                    placeholder="Search movies..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="navbar-search-input"
                />
                <button className="navbar-search-btn" onClick={handleSearch} aria-label="Search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </button>
            </div>

            <div className="navbar-profile">
                {token && (
                    <Link to="/dashboard" className="navbar-avatar" title="My Dashboard">
                        {user?.avatar
                            ? <img src={user.avatar} alt="avatar" className="navbar-avatar__img" />
                            : <span className="navbar-avatar__initials">{email?.[0].toUpperCase()}</span>
                        }
                    </Link>
                )}
                {token
                    ? <button className="navbar-btn" onClick={handleLogout}>Logout</button>
                    : <Link to="/login" className="navbar-btn navbar-btn--cta">Get Started</Link>
                }
            </div>
        </nav>
    );
}
