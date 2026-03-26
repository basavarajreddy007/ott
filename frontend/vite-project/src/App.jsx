import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import MovieCard from './components/MovieCard';
import VideoPlayer from './components/VideoPlayer';
import Login from './components/Login';
import AIScript from './components/AIScript';
import AIAnalyze from './components/AIAnalyze';
import Upload from './components/Upload';
import Profile from './components/Profile';

import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Guard = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" replace />;
};

const Home = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/api/v1/videos`)
            .then(res => { if (res.data.success) setMovies(res.data.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            {loading && <div className="hero-loading">Loading...</div>}
            {!loading && (
                <>
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
                </>
            )}
        </div>
    );
};

const MoviesFeed = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query') || '';
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = query
            ? `${API}/api/v1/videos/search?q=${encodeURIComponent(query)}`
            : `${API}/api/v1/videos`;
        setLoading(true);
        axios.get(url)
            .then(res => { if (res.data.success) setMovies(res.data.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [query]);

    return (
        <div className="home-container">
            <h2 className="section-title">
                {loading
                    ? (query ? `Searching "${query}"...` : 'Loading...')
                    : (query ? `Results for "${query}" (${movies.length})` : 'All Movies')}
            </h2>
            {!loading && (
                <div className="movie-grid">
                    {movies.length > 0
                        ? movies.map(m => <MovieCard key={m._id} movie={m} />)
                        : <p style={{ color: '#64748b' }}>{query ? `No results for "${query}".` : 'No movies available.'}</p>
                    }
                </div>
            )}
        </div>
    );
};

export default function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/"             element={<Guard><Home /></Guard>} />
                <Route path="/movies"       element={<Guard><MoviesFeed /></Guard>} />
                <Route path="/search"       element={<Guard><MoviesFeed /></Guard>} />
                <Route path="/watch/:id"    element={<Guard><VideoPlayer /></Guard>} />
                <Route path="/upload"       element={<Guard><Upload /></Guard>} />
                <Route path="/ai-script"    element={<Guard><AIScript /></Guard>} />
                <Route path="/ai-analyze"   element={<Guard><AIAnalyze /></Guard>} />
                <Route path="/profile/:email" element={<Guard><Profile /></Guard>} />
                <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}
