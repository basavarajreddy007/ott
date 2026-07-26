import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { HiPlay } from "react-icons/hi";
import { motion } from "framer-motion";
import { tvShowAPI } from "../services/api";
import toast from "react-hot-toast";

const listStaggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const episodeCardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export default function TvShowDetails() {
  const { slug } = useParams();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(0);

  useEffect(() => {
    tvShowAPI.getBySlug(slug)
      .then(({ data }) => { setShow(data.data); })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load TV show details. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="details-loading">
        <div className="skeleton" style={{ height: "70vh", borderRadius: 0 }} />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="browse-empty">
        <h3>TV Show not found</h3>
      </div>
    );
  }

  const seasons = show.seasons || [];

  return (
    <div className="details-page">
      <div className="details-banner">
        <img src={show.banner?.url || show.poster?.url || null} alt="" className="details-banner-img" />
        <div className="details-banner-gradient" />
      </div>

      <div className="details-content">
        <div className="details-poster">
          <motion.img
            layoutId={`poster-${show._id}`}
            src={show.poster?.url || null}
            alt={show.title}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="details-info">
          <h1 className="details-title">{show.title}</h1>
          <div className="details-meta">
            <span className="details-rating">&#9733; {show.imdbRating}</span>
            <span>{show.releaseYear}</span>
            <span className="quality-badge">{show.quality}</span>
            <span>{show.language}</span>
            <span>{show.totalSeasons} Season{show.totalSeasons > 1 ? "s" : ""}</span>
            <span>{show.totalEpisodes} Episodes</span>
          </div>
          <div className="details-genres">
            {show.genres?.map((g) => (
              <span key={g._id} className="genre-chip">{g.name}</span>
            ))}
          </div>
          <p className="details-desc">{show.description}</p>

          {seasons.length > 0 && (
            <div className="seasons-section">
              <h3>Seasons</h3>
              <div className="season-tabs" style={{ position: "relative" }}>
                {seasons.map((s, i) => (
                  <button
                    key={i}
                    className={`season-tab ${activeSeason === i ? "active" : ""}`}
                    onClick={() => setActiveSeason(i)}
                    style={{ position: "relative" }}
                  >
                    <span>Season {s.seasonNumber}</span>
                    {activeSeason === i && (
                      <motion.span
                        layoutId="season-tab-indicator"
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: "3px",
                          backgroundColor: "var(--color-accent-primary)",
                          borderRadius: "2px"
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <motion.div
                key={activeSeason}
                className="episodes-list"
                variants={listStaggerVariants}
                initial="hidden"
                animate="visible"
              >
                {seasons[activeSeason]?.episodes?.map((ep) => (
                  <motion.div
                    key={ep._id}
                    variants={episodeCardVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.99 }}
                    style={{ display: "block" }}
                  >
                    <Link to={show.isLocked ? "/subscription" : `/watch/TvShow/${show.slug}?season=${ep.seasonNumber}&episode=${ep.episodeNumber}`} className="episode-card">
                      <div className="episode-thumb">
                        {ep.thumbnail?.url ? (
                          <img src={ep.thumbnail.url} alt="" />
                        ) : (
                          <div className="episode-placeholder">{show.isLocked ? "🔒" : <HiPlay />}</div>
                        )}
                      </div>
                      <div className="episode-info">
                        <span className="episode-number">S{ep.seasonNumber}:E{ep.episodeNumber}</span>
                        <h4 className="episode-title">{ep.title}</h4>
                        <p className="episode-desc">{ep.description}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
