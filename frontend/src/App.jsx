import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from './services/api';

import SplashScreen from './components/SplashScreen';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import MovieCard from './components/MovieCard';
import VideoPlayer from './components/VideoPlayer';
import Login from './components/Login';
import AIScript from './components/AIScript';
import AIAnalyze from './components/AIAnalyze';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import PaymentPage from './components/payment/PaymentPage';
import PaymentSuccess from './pages/PaymentSuccess';

import './App.css';

const Guard = ({ children }) => {
    const token = useSelector(s => s.auth.token);
    return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const token = useSelector(s => s.auth.token);
    return token ? <Navigate to="/dashboard" replace /> : children;
};

function MoviesFeed({ showHero = false }) {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query') || '';
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const url = query ? `/videos/search?q=${encodeURIComponent(query)}` : '/videos';
        api.get(url)
            .then(res => { if (res.data.success) setMovies(res.data.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [query]);

    if (loading && showHero) return <div className="hero-loading">Loading...</div>;

    const title = loading
        ? (query ? `Searching "${query}"...` : 'Loading...')
        : (query ? `Results for "${query}" (${movies.length})` : 'All Movies');

    // Split movies into sections for the home view
    const trending = movies.slice(0, 8);
    const topPicks = movies.slice(8, 16);
    const recentlyAdded = [...movies].reverse().slice(0, 8);

    return (
        <div>
            {showHero && <HeroBanner movies={movies} />}
            <div className="home-container">
                {query ? (
                    <>
                        <h2 className="section-title">{title}</h2>
                        {!loading && (
                            <div className="movie-grid">
                                {movies.length > 0
                                    ? movies.map(m => <MovieCard key={m._id} movie={m} />)
                                    : <p style={{ color: 'var(--text-3)' }}>No results for "{query}".</p>
                                }
                            </div>
                        )}
                    </>
                ) : !loading && showHero ? (
                    <>
                        {trending.length > 0 && (
                            <div className="content-section">
                                <h2 className="section-title section-title--red">Trending Now</h2>
                                <div className="content-row">
                                    {trending.map(m => <MovieCard key={m._id} movie={m} />)}
                                </div>
                            </div>
                        )}
                        {topPicks.length > 0 && (
                            <div className="content-section">
                                <h2 className="section-title section-title--gold">Top Picks</h2>
                                <div className="content-row">
                                    {topPicks.map(m => <MovieCard key={m._id} movie={m} />)}
                                </div>
                            </div>
                        )}
                        {recentlyAdded.length > 0 && (
                            <div className="content-section">
                                <h2 className="section-title">Recently Added</h2>
                                <div className="content-row">
                                    {recentlyAdded.map(m => <MovieCard key={m._id} movie={m} />)}
                                </div>
                            </div>
                        )}
                    </>
                ) : !loading ? (
                    <>
                        <h2 className="section-title">{title}</h2>
                        <div className="movie-grid">
                            {movies.length > 0
                                ? movies.map(m => <MovieCard key={m._id} movie={m} />)
                                : <p style={{ color: 'var(--text-3)' }}>No movies available.</p>
                            }
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function App() {
    const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashShown'));

    return (
        <>
            {showSplash && <SplashScreen onComplete={() => { sessionStorage.setItem('splashShown', 'true'); setShowSplash(false); }} />}
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/register"         element={<PublicRoute><Register /></PublicRoute>} />
                    <Route path="/"                 element={<Guard><MoviesFeed showHero /></Guard>} />
                    <Route path="/movies"           element={<Guard><MoviesFeed /></Guard>} />
                    <Route path="/search"           element={<Guard><MoviesFeed /></Guard>} />
                    <Route path="/watch/:id"        element={<Guard><VideoPlayer /></Guard>} />
                    <Route path="/upload"           element={<Guard><Upload /></Guard>} />
                    <Route path="/ai-script"        element={<Guard><AIScript /></Guard>} />
                    <Route path="/ai-analyze"       element={<Guard><AIAnalyze /></Guard>} />
                    <Route path="/dashboard"        element={<Guard><Dashboard /></Guard>} />
                    <Route path="/payment"          element={<Guard><PaymentPage /></Guard>} />
                    <Route path="/payment-success"  element={<Guard><PaymentSuccess /></Guard>} />
                    <Route path="/profile/:email"   element={<Navigate to="/dashboard" replace />} />
                    <Route path="*"                 element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </>
    );
}
