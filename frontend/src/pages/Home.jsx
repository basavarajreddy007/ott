import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { getRequests } from '../services/requestService';
import HeroBanner from '../components/HeroBanner';
import MovieCard from '../components/MovieCard';
import RequestForm from '../components/RequestForm';
import RequestsList from '../components/RequestsList';
import '../css/requests.css';

function Section({ title, className, items }) {
    if (items.length === 0) return null;
    return (
        <div className="content-section">
            <h2 className={`section-title ${className || ''}`}>{title}</h2>
            <div className="content-row">
                {items.map(function(movie) {
                    return <MovieCard key={movie._id} movie={movie} />;
                })}
            </div>
        </div>
    );
}

function TopRequestBanner({ request }) {
    if (!request) return null;
    return (
        <div className="top-req-banner">
            <div className="top-req-banner__glow" />
            <div className="top-req-banner__left">
                <span className="top-req-banner__fire">🔥</span>
                <div>
                    <p className="top-req-banner__label">Most Requested by Community</p>
                    <p className="top-req-banner__title">{request.title}</p>
                </div>
            </div>
            <div className="top-req-banner__right">
                <span className="top-req-banner__count">{request.count}</span>
                <span className="top-req-banner__votes">votes</span>
            </div>
        </div>
    );
}

export default function Home({ showHero = false }) {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query') || '';

    const [movies, setMovies]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [requests, setRequests] = useState([]);

    useEffect(function() {
        setLoading(true);
        const url = query ? `/videos/search?q=${encodeURIComponent(query)}` : '/videos';
        api.get(url)
            .then(function(res) {
                if (res.data.success) setMovies(res.data.data);
            })
            .catch(function() {})
            .finally(function() { setLoading(false); });
    }, [query]);

    useEffect(function() {
        if (!query) {
            getRequests().then(setRequests).catch(function() {});
        }
    }, [query]);

    function handleNewRequest(newReq) {
        if (!newReq) return;
        setRequests(function(prev) {
            const exists = prev.find(function(r) { return r._id === newReq._id; });
            if (exists) {
                return prev
                    .map(function(r) { return r._id === newReq._id ? newReq : r; })
                    .sort(function(a, b) { return b.count - a.count; });
            }
            return [newReq, ...prev].sort(function(a, b) { return b.count - a.count; });
        });
    }

    if (query) {
        return (
            <div className="home-container">
                <h2 className="section-title">
                    {loading ? `Searching "${query}"...` : `Results for "${query}" (${movies.length})`}
                </h2>
                {!loading && (
                    <div className="movie-grid">
                        {movies.length > 0
                            ? movies.map(function(movie) { return <MovieCard key={movie._id} movie={movie} />; })
                            : <p style={{ color: 'var(--text-3)' }}>No results for "{query}".</p>
                        }
                    </div>
                )}
            </div>
        );
    }

    const topPicks = movies.slice(0, 16);
    const topRequest = requests[0] && requests[0].count > 1 ? requests[0] : null;

    return (
        <div>
            {showHero && <HeroBanner movies={movies} />}

            <div className="home-container">
                {topRequest && <TopRequestBanner request={topRequest} />}

                {!loading && (
                    <Section title="Top Picks" className="section-title--gold" items={topPicks} />
                )}

                <div className="req-section">
                    <div className="req-section-header">
                        <h2 className="req-section-title">
                            <span className="req-section-title-icon">🎯</span>
                            Community Requests
                            {requests.length > 0 && (
                                <span className="req-section-count">{requests.length}</span>
                            )}
                        </h2>
                        <p className="req-section-sub">Vote for what you want to watch next</p>
                    </div>
                    <RequestForm onSubmitted={handleNewRequest} />
                    <RequestsList requests={requests} />
                </div>
            </div>
        </div>
    );
}
