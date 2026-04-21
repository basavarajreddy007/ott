import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/herobanner.css';

const SLIDE_INTERVAL = 6000;

export default function HeroBanner({ movies }) {
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        setProgress(0);
        if (paused || movies.length <= 1) return;

        const start = Date.now();

        const tick = setInterval(() => {
            const elapsed = Date.now() - start;
            setProgress(Math.min((elapsed / SLIDE_INTERVAL) * 100, 100));
        }, 50);

        timerRef.current = setTimeout(() => {
            setIndex(i => (i + 1) % movies.length);
        }, SLIDE_INTERVAL);

        return () => {
            clearTimeout(timerRef.current);
            clearInterval(tick);
        };
    }, [index, paused, movies.length]);

    if (!movies?.length) return (
        <div className="hero-empty">
            <div className="hero-empty__icon">🎬</div>
            <p>No movies to display</p>
        </div>
    );

    const movie = movies[index];

    return (
        <section
            className="hero"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <video
                key={movie._id}
                className="hero-bg-video hero-bg-video--kenburns"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                autoPlay muted loop playsInline
                poster={movie.thumbnailUrl}
            >
                <source src={movie.videoUrl} type="video/mp4" />
            </video>

            <div className="hero-overlay hero-overlay--vignette" />
            <div className="hero-overlay hero-overlay--bottom" />
            <div className="hero-overlay hero-overlay--left" />
            <div className="hero-grain" aria-hidden="true" />

            <div className="hero-content">
                <div className="hero-badge">
                    <span className="hero-badge__dot" />
                    Now Streaming
                </div>

                <h1 className="hero-title">{movie.title}</h1>

                <div className="hero-meta">
                    {movie.releaseYear && <span className="hero-meta__item">{movie.releaseYear}</span>}
                    {movie.genres?.[0] && <span className="hero-meta__item hero-meta__item--genre">{movie.genres[0]}</span>}
                    {movie.duration && <span className="hero-meta__item">{movie.duration} min</span>}
                </div>

                <p className="hero-description">{movie.description}</p>

                <div className="hero-actions">
                    <button className="hero-btn hero-btn--primary" onClick={() => navigate(`/watch/${movie._id}`)}>
                        <span className="hero-btn__inner">
                            <svg className="hero-btn__icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Play Now
                        </span>
                    </button>
                    <button className="hero-btn hero-btn--secondary" onClick={() => navigate('/movies')}>
                        <svg className="hero-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                        </svg>
                        More Info
                    </button>
                </div>
            </div>

            {movies.length > 1 && (
                <div className="hero-controls">
                    {movies.map((m, i) => (
                        <button
                            key={m._id}
                            className={`hero-slide-btn${i === index ? ' active' : ''}`}
                            onClick={() => setIndex(i)}
                            aria-label={`Go to ${m.title}`}
                        >
                            <span className="hero-slide-btn__label">{m.title}</span>
                            <span className="hero-slide-btn__track">
                                <span
                                    className="hero-slide-btn__fill"
                                    style={{ width: i === index ? `${progress}%` : i < index ? '100%' : '0%' }}
                                />
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="hero-scroll-hint" aria-hidden="true">
                <span className="hero-scroll-hint__line" />
                <span className="hero-scroll-hint__text">Scroll</span>
            </div>
        </section>
    );
}
