import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { HiPlay, HiHeart, HiPlus } from "react-icons/hi";
import { movieAPI, favoriteAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import MovieCard from "../components/common/MovieCard";
import toast from "react-hot-toast";
import "../css/Details.css";

const listStaggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const castItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  }
};

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
      } catch (err) {
        console.error(err);
        toast.error("Failed to load movie details. Please try again.");
      } finally {
        setLoading(false);
      }
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
    } catch {
      toast.error("Failed to update favorites");
    }
  };

  if (loading) {
    return (
      <div className="details-loading">
        <div className="skeleton" style={{ height: "70vh", borderRadius: 0 }} />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="browse-empty">
        <h3>Movie not found</h3>
      </div>
    );
  }

  return (
    <div className="details-page">
      <div className="details-banner">
        <img src={movie.banner?.url || movie.poster?.url || null} alt="" className="details-banner-img" />
        <div className="details-banner-gradient" />
      </div>

      <div className="details-content">
        <div className="details-poster">
          <motion.img
            layoutId={`poster-${movie._id}`}
            src={movie.poster?.url || null}
            alt={movie.title}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
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
              <motion.div
                className="cast-list"
                variants={listStaggerVariants}
                initial="hidden"
                animate="visible"
              >
                {movie.cast.map((c, i) => (
                  <motion.div key={i} className="cast-item" variants={castItemVariants}>
                    {c.image && <img src={c.image || null} alt={c.name} />}
                    <span className="cast-name">{c.name}</span>
                    <span className="cast-role">{c.role}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          <div className="details-actions">
            {movie.isLocked ? (
              <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} style={{ display: "inline-block" }}>
                <Link to="/subscription" className="btn btn-primary btn-lg">Upgrade to Watch</Link>
              </motion.div>
            ) : (
              <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} style={{ display: "inline-block" }}>
                <Link to={`/watch/Movie/${movie.slug}`} className="btn btn-primary btn-lg"><HiPlay /> Play</Link>
              </motion.div>
            )}
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              className={`btn btn-lg ${isFavorite ? "btn-primary" : "btn-secondary"}`}
              onClick={toggleFavorite}
            >
              <HiHeart /> {isFavorite ? "Favorited" : "Favorite"}
            </motion.button>
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-secondary btn-lg"
            >
              <HiPlus /> Watchlist
            </motion.button>
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
          <motion.div
            className="similar-grid"
            variants={listStaggerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {similar.map((s) => <MovieCard key={s._id} item={s} type="Movie" />)}
          </motion.div>
        </section>
      )}
    </div>
  );
}
