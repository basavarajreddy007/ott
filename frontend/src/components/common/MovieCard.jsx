import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiPlay, HiHeart, HiPlus } from "react-icons/hi";
import { favoriteAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../css/MovieCard.css";

export default function MovieCard({ item, type = "Movie", featured = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const slug = item?.slug;
  const poster = item?.poster?.url || null;
  const title = item?.title || "";
  const year = item?.releaseYear || "";
  const rating = item?.imdbRating || 0;
  const duration = item?.duration || 0;
  const quality = item?.quality || "HD";
  const genres = item?.genres || [];

  useEffect(() => {
    if (user && item?._id) {
      favoriteAPI.check(item._id, type).then(({ data }) => setIsFavorite(data.data.isFavorite)).catch(() => {});
    }
  }, [user, item?._id, type]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");

    try {
      if (isFavorite) {
        await favoriteAPI.remove(item._id, type);
        setIsFavorite(false);
      } else {
        await favoriteAPI.add({ contentId: item._id, contentType: type });
        setIsFavorite(true);
      }
    } catch {}
  };

  const detailPath = type === "Movie" ? `/movies/${slug}` : type === "TvShow" ? `/tv-shows/${slug}` : `/web-series/${slug}`;

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Link to={detailPath} className={`movie-card ${featured ? "featured" : ""}`}>
      <div className="movie-card-poster">
        {!imgLoaded && !imgError && <div className="skeleton movie-card-skeleton" />}
        {imgError ? (
          <div className="movie-card-error">
            <span>{title?.[0] || "?"}</span>
          </div>
        ) : (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{ display: imgLoaded ? "block" : "none" }}
          />
        )}

        <div className="movie-card-overlay">
          <div className="movie-card-actions">
            <button className="card-action-btn play-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(detailPath); }}>
              <HiPlay />
            </button>
            {user && (
              <>
                <button className={`card-action-btn ${isFavorite ? "favorited" : ""}`} onClick={toggleFavorite}>
                  <HiHeart />
                </button>
                <button className="card-action-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <HiPlus />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="movie-card-badge">{quality}</div>
      </div>

      <div className="movie-card-info">
        <div className="movie-card-meta">
          {rating > 0 && <span className="movie-rating">&#9733; {rating}</span>}
          <span className="movie-year">{year}</span>
          <span className="movie-duration">{formatDuration(duration)}</span>
        </div>
        <h3 className="movie-card-title">{title}</h3>
        {genres.length > 0 && (
          <div className="movie-card-genres">
            {genres.slice(0, 2).map((g) => (
              <span key={g._id || g} className="genre-tag">{g.name || g}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
