import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/herobanner.css';

export default function HeroBanner({ movies }) {
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        if (!movies || movies.length === 0) return;

        const interval = setInterval(() => {
            setFading(true);
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % movies.length);
                setFading(false);
            }, 500);
        }, 5000);

        return () => clearInterval(interval);
    }, [movies]);

    const movie = movies?.[index];

    return !movies || movies.length === 0 ? (
        <div className="hero-banner-loading">No movies to display</div>
    ) : (
        <div className="hero-banner">
            <video
                key={movie.videoUrl}
                className="hero-video"
                autoPlay
                muted
                loop
                playsInline
                poster={movie.thumbnailUrl}
            >
                <source src={movie.videoUrl} type="video/mp4" />
            </video>

            <div className="hero-overlay"></div>

            <div className={`hero-content${fading ? ' fading' : ''}`}>
                <span className="hero-badge">Featured</span>
                <h1 className="hero-title">{movie?.title}</h1>
                <p className="hero-description">{movie?.description}</p>
                <div className="hero-actions">
                    <button
                        className="hero-button"
                        onClick={() => navigate(`/watch/${movie?._id}`)}
                    >
                        ▶ Watch Now
                    </button>
                </div>
            </div>

            {movies.length > 1 && (
                <div className="hero-dots">
                    {movies.map((_, i) => (
                        <button
                            key={i}
                            className={`hero-dot${i === index ? ' active' : ''}`}
                            onClick={() => { setFading(true); setTimeout(() => { setIndex(i); setFading(false); }, 500); }}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
