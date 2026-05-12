import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import { useAuthDispatch, clearUser } from '../store/index.jsx';
import '../css/navbar.css';

export default function Navbar() {
    const { user } = useAuth();
    const dispatch = useAuthDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (searchOpen) searchRef.current?.focus();
    }, [searchOpen]);

    const handleLogout = () => {
        dispatch(clearUser());
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery('');
        }
    };

    const isActive = (path) => location.pathname === path;

    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() ?? '?';

    return (
        <motion.nav
            className={`nb${scrolled ? ' nb--scrolled' : ''}`}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
        >
            <div className="nb__glow-line" />

            {/* Logo */}
            <Link to="/" className="nb__logo">
                <div className="nb__logo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M5 3l14 9-14 9V3z" fill="url(#lg)" />
                        <defs>
                            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#00d4ff" />
                                <stop offset="100%" stopColor="#9b59ff" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <span className="nb__logo-text">CineVault</span>
            </Link>

            {/* Desktop Links */}
            <div className="nb__links">
                <Link to="/" className={`nb__link${isActive('/') ? ' nb__link--active' : ''}`}>Home</Link>
                <Link to="/movies" className={`nb__link${isActive('/movies') ? ' nb__link--active' : ''}`}>Movies</Link>
                <Link to="/dashboard" className={`nb__link${isActive('/dashboard') ? ' nb__link--active' : ''}`}>Dashboard</Link>
                {user && (
                    <Link to="/studio" className={`nb__link nb__link--studio${isActive('/studio') ? ' nb__link--active' : ''}`}>✦ Studio</Link>
                )}
                {user?.role === 'admin' && (
                    <Link to="/admin" className={`nb__link nb__link--admin${isActive('/admin') ? ' nb__link--active' : ''}`}>Admin</Link>
                )}
                {user?.plan !== 'Premium' && (
                    <Link to="/payment" className="nb__link nb__link--upgrade">⚡ Upgrade</Link>
                )}
            </div>

            {/* Actions */}
            <div className="nb__actions">
                {/* Search */}
                <div className="nb__search-wrap">
                    <AnimatePresence>
                        {searchOpen && (
                            <motion.div
                                className="nb__search-box"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 220, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                <form onSubmit={handleSearch} style={{ width: '100%' }}>
                                    <input
                                        ref={searchRef}
                                        className="nb__search-input"
                                        placeholder="Search movies..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                                    />
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.button
                        className="nb__icon-btn"
                        onClick={() => setSearchOpen(v => !v)}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Search"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                    </motion.button>
                </div>

                {/* Avatar */}
                <div className="nb__profile">
                    <Link to="/dashboard" className="nb__avatar" title="Profile">
                        {user?.avatar
                            ? <img src={user.avatar} alt="avatar" className="nb__avatar-img" />
                            : <span className="nb__avatar-initials">{initials}</span>
                        }
                    </Link>
                    <motion.button
                        className="nb__btn"
                        onClick={handleLogout}
                        whileTap={{ scale: 0.95 }}
                    >
                        Logout
                    </motion.button>
                </div>

                {/* Hamburger */}
                <button
                    className="nb__hamburger"
                    onClick={() => setMenuOpen(v => !v)}
                    aria-label="Toggle menu"
                >
                    <span className={`nb__ham-line${menuOpen ? ' nb__ham-line--1-open' : ''}`} />
                    <span className={`nb__ham-line${menuOpen ? ' nb__ham-line--2-open' : ''}`} />
                    <span className={`nb__ham-line${menuOpen ? ' nb__ham-line--3-open' : ''}`} />
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        className="nb__mobile"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Link to="/" className={`nb__mobile-link${isActive('/') ? ' nb__mobile-link--active' : ''}`}>Home</Link>
                        <Link to="/movies" className={`nb__mobile-link${isActive('/movies') ? ' nb__mobile-link--active' : ''}`}>Movies</Link>
                        <Link to="/dashboard" className={`nb__mobile-link${isActive('/dashboard') ? ' nb__mobile-link--active' : ''}`}>Dashboard</Link>
                        {user && (
                            <Link to="/studio" className="nb__mobile-link">✦ Studio</Link>
                        )}
                        {user?.role === 'admin' && (
                            <Link to="/admin" className="nb__mobile-link">Admin</Link>
                        )}
                        {user?.plan !== 'Premium' && (
                            <Link to="/payment" className="nb__mobile-link">⚡ Upgrade</Link>
                        )}
                        <div className="nb__mobile-search">
                            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flex: 1 }}>
                                <input
                                    className="nb__search-input"
                                    placeholder="Search movies..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="nb__mobile-search-btn">Search</button>
                            </form>
                        </div>
                        <button className="nb__btn" onClick={handleLogout} style={{ marginTop: 8 }}>Logout</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
