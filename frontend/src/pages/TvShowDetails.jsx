import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { HiPlay, HiStar, HiHeart, HiPlus, HiCheck, HiFilm } from "react-icons/hi";
import { motion } from "framer-motion";
import { tvShowAPI, favoriteAPI, watchlistAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import "../css/Details.css";

export default function TvShowDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const mockFallbackShow = {
    _id: "tv-detail-1",
    title: "House of Shadows: Protocol",
    slug: slug,
    type: "TvShow",
    releaseYear: 2026,
    imdbRating: 9.3,
    totalSeasons: 2,
    totalEpisodes: 16,
    quality: "4K HDR",
    language: "English (Dolby Atmos)",
    description: "An intricate psychological thriller following elite cyber-intelligence operatives locked in a covert game of strategy across global capitals.",
    poster: { url: "https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80" },
    banner: { url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80" },
    genres: [{ _id: "g1", name: "Thriller" }, { _id: "g2", name: "Drama" }, { _id: "g3", name: "Mystery" }],
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          { _id: "ep1", episodeNumber: 1, seasonNumber: 1, title: "Episode 1: The Initiation Protocol", duration: 52, description: "A high-profile cyber intrusion at the central bank triggers a quiet investigation.", thumbnail: { url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80" } },
          { _id: "ep2", episodeNumber: 2, seasonNumber: 1, title: "Episode 2: Deep Spectrum", duration: 49, description: "Cipher leads her team into a subterranean data vault under heavy surveillance.", thumbnail: { url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80" } },
          { _id: "ep3", episodeNumber: 3, seasonNumber: 1, title: "Episode 3: Echo Chambers", duration: 55, description: "Unlikely alliances form when an artificial intelligence initiates rogue defense vectors.", thumbnail: { url: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80" } }
        ]
      },
      {
        seasonNumber: 2,
        episodes: [
          { _id: "ep201", episodeNumber: 1, seasonNumber: 2, title: "Episode 1: Ghost Signals", duration: 58, description: "Six months after the incident, mysterious broadcast signals emerge across secure channels.", thumbnail: { url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80" } },
          { _id: "ep202", episodeNumber: 2, seasonNumber: 2, title: "Episode 2: The Blackout", duration: 54, description: "The grid goes dark as tension reaches a boiling point across the capital.", thumbnail: { url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80" } }
        ]
      }
    ]
  };

  useEffect(() => {
    tvShowAPI.getBySlug(slug)
      .then(({ data }) => {
        const item = data?.data || mockFallbackShow;
        setShow(item);
        if (user) {
          favoriteAPI.check(item._id, "TvShow")
            .then(({ data }) => setIsFavorite(Boolean(data?.data?.isFavorite)))
            .catch(() => setIsFavorite(false));

          watchlistAPI.check(item._id, "TvShow")
            .then(({ data }) => setIsInWatchlist(Boolean(data?.data?.isInWatchlist)))
            .catch(() => setIsInWatchlist(false));
        }
      })
      .catch(() => {
        setShow(mockFallbackShow);
      })
      .finally(() => setLoading(false));
  }, [slug, user]);

  const toggleFavorite = async () => {
    if (!user) return navigate("/login");
    try {
      if (isFavorite) {
        await favoriteAPI.remove(show._id, "TvShow");
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await favoriteAPI.add({ contentId: show._id, contentType: "TvShow" });
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    } catch {
      setIsFavorite(!isFavorite);
    }
  };

  const toggleWatchlist = async () => {
    if (!user) return navigate("/login");
    try {
      if (isInWatchlist) {
        await watchlistAPI.remove(show._id, "TvShow");
        setIsInWatchlist(false);
        toast.success("Removed from watchlist");
      } else {
        await watchlistAPI.add({ contentId: show._id, contentType: "TvShow" });
        setIsInWatchlist(true);
        toast.success("Added to watchlist");
      }
    } catch {
      setIsInWatchlist(!isInWatchlist);
    }
  };

  if (loading) {
    return (
      <div className="details-loading">
        <div className="skeleton" style={{ height: "70vh", borderRadius: 0 }} />
      </div>
    );
  }

  const seasons = show.seasons || mockFallbackShow.seasons;

  return (
    <div className="details-page">
      <div className="details-banner">
        <img src={show.banner?.url || show.poster?.url} alt="" className="details-banner-img" />
        <div className="details-banner-gradient" />
      </div>

      <div className="details-content">
        <div className="details-poster">
          <motion.img
            src={show.poster?.url || show.banner?.url}
            alt={show.title}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          />
        </div>

        <div className="details-info">
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
            <span className="hero-match-chip">99% Match</span>
            <span className="quality-badge">{show.quality || "4K HDR"}</span>
            <span className="hero-audio-chip">DOLBY ATMOS</span>
          </div>

          <h1 className="details-title">{show.title}</h1>

          <div className="details-meta">
            <span className="details-rating"><HiStar /> {show.imdbRating || "9.3"}</span>
            <span>•</span>
            <span>{show.releaseYear || "2026"}</span>
            <span>•</span>
            <span>{show.totalSeasons || seasons.length} Season{seasons.length > 1 ? "s" : ""}</span>
            <span>•</span>
            <span>{show.language || "English"}</span>
          </div>

          <div className="details-genres">
            {show.genres?.map((g) => (
              <span key={g._id || g.name} className="genre-chip">{g.name || g}</span>
            ))}
          </div>

          <p className="details-desc">{show.description}</p>

          <div className="details-actions">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link to={`/watch/TvShow/${show.slug}?season=1&episode=1`} className="btn btn-primary btn-lg">
                <HiPlay style={{ fontSize: "24px" }} /> Play S1:E1
              </Link>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`btn btn-lg ${isFavorite ? "btn-primary" : "btn-secondary"}`}
              onClick={toggleFavorite}
            >
              <HiHeart /> {isFavorite ? "Favorited" : "Favorite"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`btn btn-lg ${isInWatchlist ? "btn-primary" : "btn-secondary"}`}
              onClick={toggleWatchlist}
            >
              {isInWatchlist ? <HiCheck /> : <HiPlus />} Watchlist
            </motion.button>
          </div>

          {seasons.length > 0 && (
            <div className="seasons-section">
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "16px" }}>Seasons & Episodes</h3>
              <div className="season-tabs" style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                {seasons.map((s, i) => (
                  <button
                    key={i}
                    className={`season-tab ${activeSeason === i ? "active" : ""}`}
                    onClick={() => setActiveSeason(i)}
                  >
                    Season {s.seasonNumber || i + 1}
                  </button>
                ))}
              </div>

              <div className="episodes-list">
                {seasons[activeSeason]?.episodes?.map((ep) => (
                  <Link
                    key={ep._id || ep.episodeNumber}
                    to={`/watch/TvShow/${show.slug}?season=${ep.seasonNumber || activeSeason + 1}&episode=${ep.episodeNumber}`}
                    className="episode-card"
                  >
                    <div className="episode-thumb">
                      <img src={ep.thumbnail?.url || show.banner?.url || show.poster?.url} alt="" />
                      <div className="episode-play-overlay">
                        <HiPlay />
                      </div>
                    </div>
                    <div className="episode-info">
                      <span className="episode-number">S{ep.seasonNumber || activeSeason + 1}:E{ep.episodeNumber} • {ep.duration || 45}m</span>
                      <h4 className="episode-title">{ep.title}</h4>
                      <p className="episode-desc">{ep.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
