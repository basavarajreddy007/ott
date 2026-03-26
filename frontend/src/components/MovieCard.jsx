import { useNavigate } from 'react-router-dom';
import '../css/moviecard.css';

export default function MovieCard({ movie }) {
    const navigate = useNavigate();

    if (!movie) return null;

    const id = movie._id || movie.id;
    const thumbnail = movie.thumbnailUrl || movie.thumbnail;

    return (
        <div className="movie-card" onClick={() => navigate(`/watch/${id}`)}>
            <div className="movie-thumbnail">
                {thumbnail
                    ? <img src={thumbnail} alt={movie.title} />
                    : <div className="movie-placeholder">No Image</div>
                }
                <div className="movie-overlay">
                    <button className="play-button">▶</button>
                </div>
            </div>
            <div className="movie-info">
                <h3>{movie.title}</h3>
            </div>
        </div>
    );
}
