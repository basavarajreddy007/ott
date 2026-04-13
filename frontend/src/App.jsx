import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from './services/api';

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

function Guard({ children }) {
    const token = useSelector(s => s.auth.token);
    return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
    const token = useSelector(s => s.auth.token);
    return token ? <Navigate to="/dashboard" replace /> : children;
}

function Home() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/videos')
            .then(res => {
                if (res.data.success) setMovies(res.data.data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="hero-loading">Loading...</div>;

    return (
        <div>
            <HeroBanner movies={movies} />
            <div className="home-container">
                <h2 className="section-title">All Movies</h2>
                <div className="movie-grid">
                    {movies.length > 0
                        ? movies.map(m => <MovieCard key={m._id} movie={m} />)
                        : <p style={{ color: '#64748b' }}>No movies available.</p>
                    }
                </div>
            </div>
        </div>
    );
}

function MoviesFeed() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query') || '';
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = query
            ? `/videos/search?q=${encodeURIComponent(query)}`
            : '/videos';

        setLoading(true);
        api.get(url)
            .then(res => {
                if (res.data.success) setMovies(res.data.data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [query]);

    const title = loading
        ? (query ? `Searching "${query}"...` : 'Loading...')
        : (query ? `Results for "${query}" (${movies.length})` : 'All Movies');

    const emptyMessage = query ? `No results for "${query}".` : 'No movies available.';

    return (
        <div className="home-container">
            <h2 className="section-title">{title}</h2>
            {!loading && (
                <div className="movie-grid">
                    {movies.length > 0
                        ? movies.map(m => <MovieCard key={m._id} movie={m} />)
                        : <p style={{ color: '#64748b' }}>{emptyMessage}</p>
                    }
                </div>
            )}
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/" element={<Guard><Home /></Guard>} />
                <Route path="/movies" element={<Guard><MoviesFeed /></Guard>} />
                <Route path="/search" element={<Guard><MoviesFeed /></Guard>} />
                <Route path="/watch/:id" element={<Guard><VideoPlayer /></Guard>} />
                <Route path="/upload" element={<Guard><Upload /></Guard>} />
                <Route path="/ai-script" element={<Guard><AIScript /></Guard>} />
                <Route path="/ai-analyze" element={<Guard><AIAnalyze /></Guard>} />
                <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
                <Route path="/payment" element={<Guard><PaymentPage /></Guard>} />
                <Route path="/payment-success" element={<Guard><PaymentSuccess /></Guard>} />
                <Route path="/profile/:email" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}
