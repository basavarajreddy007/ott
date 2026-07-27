import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiPlay, HiHeart, HiPlus, HiCheck } from "react-icons/hi";
import { motion } from "framer-motion";
import { favoriteAPI, watchlistAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import {
  cardVariants,
  cardHoverVariants,
  posterZoomVariants,
  cardInfoVariants
} from "../../animations";
import "../../css/MovieCard.css";

const MotionLink = motion.create(Link);

export default function MovieCard({ item, type = "Movie", featured = false, progress }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const finalType = item?.type || type;
  const slug = item?.slug;
  const poster = item?.poster?.url || null;
  const title = item?.title || "";
  const year = item?.releaseYear || "";
  const rating = item?.imdbRating || 0;
  const duration = item?.duration || 0;
  const quality = item?.quality || "HD";
  const genres = item?.genres || [];

  useEffect(() => {
    if (!user || !item?._id) {
      setIsFavorite(false);
      setIsInWatchlist(false);
      return;
    }
    favoriteAPI.check(item._id, finalType)
      .then(({ data }) => setIsFavorite(Boolean(data?.data?.isFavorite)))
      .catch(() => setIsFavorite(false));

    watchlistAPI.check(item._id, finalType)
      .then(({ data }) => setIsInWatchlist(Boolean(data?.data?.isInWatchlist)))
      .catch(() => setIsInWatchlist(false));
  }, [user, item?._id, finalType]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    try {
      if (isFavorite) {
        await favoriteAPI.remove(item._id, finalType);
        setIsFavorite(false);
      } else {
        await favoriteAPI.add({ contentId: item._id, contentType: finalType });
        setIsFavorite(true);
      }
    } catch {}
  };

  const toggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    try {
      if (isInWatchlist) {
        await watchlistAPI.remove(item._id, finalType);
        setIsInWatchlist(false);
        toast.success("Removed from watchlist");
      } else {
        await watchlistAPI.add({ contentId: item._id, contentType: finalType });
        setIsInWatchlist(true);
        toast.success("Added to watchlist");
      }
    } catch {
      toast.error("Failed to update watchlist");
    }
  };

  const detailPath = finalType === "Movie" ? `/movies/${slug}` : finalType === "TvShow" ? `/tv-shows/${slug}` : `/web-series/${slug}`;

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  const combinedVariants = {
    hidden: cardVariants.hidden,
    visible: cardVariants.visible,
    hover: cardHoverVariants.hover
  };

  return (
    <MotionLink
      to={detailPath}
      className={`movie-card ${featured ? "featured" : ""}`}
      variants={combinedVariants}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      custom={{ delay: 0.1 }}
    >
      <div className="movie-card-poster">
        {!imgLoaded && !imgError && <div className="skeleton movie-card-skeleton" />}
        {imgError ? (
          <div className="movie-card-error">
            <span>{title?.[0] || "?"}</span>
          </div>
        ) : (
          <motion.img
            layoutId={`poster-${item?._id}`}
            src={poster}
            alt={title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            variants={posterZoomVariants}
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
                <motion.button
                  className={`card-action-btn ${isFavorite ? "favorited" : ""}`}
                  onClick={toggleFavorite}
                  whileTap={{ scale: 0.8 }}
                >
                  <motion.div
                    key={isFavorite}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 12 }}
                  >
                    <HiHeart />
                  </motion.div>
                </motion.button>
                <motion.button
                  className={`card-action-btn ${isInWatchlist ? "favorited" : ""}`}
                  onClick={toggleWatchlist}
                  whileTap={{ scale: 0.8 }}
                >
                  <motion.div
                    key={isInWatchlist}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 12 }}
                  >
                    {isInWatchlist ? <HiCheck /> : <HiPlus />}
                  </motion.div>
                </motion.button>
              </>
            )}
          </div>
        </div>

        <div className="movie-card-badge">{quality}</div>

        {progress !== undefined && progress > 0 && (
          <div className="movie-card-progress-bar">
            <div className="movie-card-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <motion.div className="movie-card-info" variants={cardInfoVariants}>
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
      </motion.div>
    </MotionLink>
  );
}
