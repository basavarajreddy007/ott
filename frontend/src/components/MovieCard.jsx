import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../store/index.jsx';
import '../css/moviecard.css';

const PLAN_RANK = { Basic: 1, Standard: 2, Premium: 3 };

export default function MovieCard({ movie }) {
    const navigate = useNavigate();
    const user = useAuthState().user;

    if (!movie) return null;

    const id        = movie._id || movie.id;
    const thumbnail = movie.thumbnailUrl || movie.thumbnail;
    const userRank  = PLAN_RANK[user && user.plan] || 1;
    const videoRank = PLAN_RANK[movie.requiredPlan] || 1;
    const locked    = user?.role !== 'admin' && userRank < videoRank;

    function handleClick() {
        navigate(`/watch/${id}`);
    }

    return (
        <div className={`movie-card${locked ? ' movie-card--locked' : ''}`} onClick={handleClick}>
            <div className="movie-thumbnail">
                {thumbnail
                    ? <img src={thumbnail} alt={movie.title} />
                    : <div className="movie-placeholder">No Image</div>
                }
                <div className="movie-overlay">
                    {locked
                        ? <span className="lock-badge">🔒 {movie.requiredPlan}</span>
                        : <button className="play-button">▶</button>
                    }
                </div>
                {locked && <span className="plan-badge">{movie.requiredPlan}</span>}
            </div>
            <div className="movie-info">
                <h3>{movie.title}</h3>
            </div>
        </div>
    );
}
