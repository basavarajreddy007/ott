import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { HiPlay, HiHeart, HiPlus } from "react-icons/hi";
import { movieAPI, favoriteAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MovieCard from "../components/common/MovieCard";
import toast from "react-hot-toast";
import "../css/Details.css";

export default function MovieDetails() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await movieAPI.getBySlug(slug);
        setMovie(data.data);
        const simRes = await movieAPI.getSimilar(data.data._id);
        setSimilar(simRes.data.data);
        if (user) {
          const favRes = await favoriteAPI.check(data.data._id, "Movie");
          setIsFavorite(favRes.data.data.isFavorite);
        }
      } catch { } finally { setLoading(false); }
    };
    fetch();
  }, [slug, user]);

  const toggleFavorite = async () => {
    if (!user) return toast.error("Sign in to add favorites");
    try {
      if (isFavorite) {
        await favoriteAPI.remove(movie._id, "Movie");
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await favoriteAPI.add({ contentId: movie._id, contentType: "Movie" });
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="details-loading"><div className="skeleton" style={{ height: "70vh", borderRadius: 0 }} /></div>;
  if (!movie) return <div className="browse-empty"><h3>Movie not found</h3></div>;

  return (
    <div className="details-page">
      <div className="details-banner">
        <img src={movie.banner?.url || movie.poster?.url} alt="" className="details-banner-img" />
        <div className="details-banner-gradient" />
      </div>

      <div className="details-content">
        <div className="details-poster">
          <img src={movie.poster?.url} alt={movie.title} />
        </div>

        <div className="details-info">
          <h1 className="details-title">{movie.title}</h1>
          <div className="details-meta">
            <span className="details-rating">&#9733; {movie.imdbRating}</span>
            <span>{movie.releaseYear}</span>
            <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
            <span className="quality-badge">{movie.quality}</span>
            <span>{movie.language}</span>
          </div>

          <div className="details-genres">
            {movie.genres?.map((g) => (
              <Link key={g._id} to={`/genre/${g._id}`} className="genre-chip">{g.name}</Link>
            ))}
          </div>

          <p className="details-desc">{movie.description}</p>

          {movie.director && <p className="details-crew"><strong>Director:</strong> {movie.director}</p>}

          {movie.cast?.length > 0 && (
            <div className="details-cast">
              <h3>Cast</h3>
              <div className="cast-list">
                {movie.cast.map((c, i) => (
                  <div key={i} className="cast-item">
                    {c.image && <img src={c.image} alt={c.name} />}
                    <span className="cast-name">{c.name}</span>
                    <span className="cast-role">{c.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="details-actions">
            <Link to={`/watch/Movie/${movie.slug}`} className="btn btn-primary btn-lg"><HiPlay /> Play</Link>
            <button className={`btn btn-lg ${isFavorite ? "btn-primary" : "btn-secondary"}`} onClick={toggleFavorite}>
              <HiHeart /> {isFavorite ? "Favorited" : "Favorite"}
            </button>
            <button className="btn btn-secondary btn-lg"><HiPlus /> Watchlist</button>
          </div>

          {movie.trailer?.url && (
            <div className="details-trailer">
              <h3>Trailer</h3>
              <video src={movie.trailer.url} controls className="trailer-video" />
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="details-section">
          <h2 className="section-title">Similar Movies</h2>
          <div className="similar-grid">
            {similar.map((s) => <MovieCard key={s._id} item={s} type="Movie" />)}
          </div>
        </section>
      )}
    </div>
  );
}
