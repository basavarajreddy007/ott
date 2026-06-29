import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { HiArrowLeft, HiHeart, HiOutlineHeart, HiStar, HiVolumeUp, HiVolumeOff, HiMenu } from "react-icons/hi";
import { movieAPI, tvShowAPI, webSeriesAPI, historyAPI, ratingAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../css/Watch.css";

export default function Watch() {
  const { type, slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        let data;
        if (type === "Movie") {
          const res = await movieAPI.getBySlug(slug);
          data = res.data.data;
          setVideoUrl(data.video?.url || data.trailer?.url || "");
        } else if (type === "TvShow") {
          const res = await tvShowAPI.getBySlug(slug);
          data = res.data.data;
          if (season && episode) {
            const ep = data.seasons?.find(s => s.seasonNumber === parseInt(season))?.episodes?.find(e => e.episodeNumber === parseInt(episode));
            setVideoUrl(ep?.video?.url || "");
          }
        } else if (type === "WebSeries") {
          const res = await webSeriesAPI.getBySlug(slug);
          data = res.data.data;
          if (season && episode) {
            const ep = data.seasons?.find(s => s.seasonNumber === parseInt(season))?.episodes?.find(e => e.episodeNumber === parseInt(episode));
            setVideoUrl(ep?.video?.url || "");
          }
        }
        setContent(data);
        if (user && data) {
          ratingAPI.getRating(data._id, type).then(({ data: rd }) => {
            if (rd.data) setUserRating(rd.data.rating);
          }).catch(() => {});
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [type, slug, season, episode, user]);

  useEffect(() => {
    if (!content || !playing) return;
    const timer = setInterval(() => {
      if (videoRef.current) {
        const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(pct);
        historyAPI.update({
          contentId: content._id,
          contentType: type,
          progress: Math.floor(pct),
          seasonNumber: season ? parseInt(season) : undefined,
          episodeNumber: episode ? parseInt(episode) : undefined,
        }).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [content, playing, type, season, episode]);

  const showControlsTemporarily = () => {
    setShowControls(true);
    setShowOverlay(false);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
        setShowOverlay(false);
      }
    }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
      setShowOverlay(false);
    } else {
      videoRef.current.pause();
      setPlaying(false);
      setShowOverlay(true);
    }
    showControlsTemporarily();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pct * (videoRef.current.duration || 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
    setVolume(v);
    setMuted(v === 0);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleRating = async (star) => {
    if (!user) return toast.error("Sign in to rate");
    if (!content) return;
    setUserRating(star);
    try {
      await ratingAPI.rate({ contentId: content._id, contentType: type, rating: star });
      toast.success(`Rated ${star} star${star > 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to save rating");
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  if (loading) return (
    <div className="watch-loading">
      <div className="watch-loading-spinner" />
    </div>
  );

  return (
    <div className="watch-page" ref={containerRef} onMouseMove={showControlsTemporarily}>
      <div className={`watch-overlay ${showOverlay && !playing ? "visible" : ""}`}>
        <div className="watch-overlay-bg" />
        <div className="watch-overlay-content">
          <div className="watch-overlay-info">
            <h1 className="watch-overlay-title">{content?.title}</h1>
            {content?.description && <p className="watch-overlay-desc">{content.description}</p>}
            <div className="watch-overlay-meta">
              {content?.releaseYear && <span>{content.releaseYear}</span>}
              {content?.quality && <span className="quality-badge">{content.quality}</span>}
              {content?.language && <span>{content.language}</span>}
              {content?.genres?.map(g => <span key={g._id || g} className="genre-chip-sm">{g.name || g}</span>)}
            </div>
          </div>
          <button className="watch-play-btn" onClick={togglePlay}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="white" strokeWidth="2" opacity="0.8" />
              <path d="M33 28L55 40L33 52V28Z" fill="white" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`watch-controls ${showControls ? "visible" : ""}`}>
        <div className="watch-nav">
          <button onClick={() => navigate(-1)} className="watch-back">
            <HiArrowLeft />
          </button>
          <span className="watch-nav-title">{content?.title}{episode ? ` - S${season}:E${episode}` : ""}</span>
        </div>

        <div className="watch-progress-bar" onClick={handleSeek}>
          <div className="watch-progress-track">
            <div className="watch-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="watch-bottom-controls">
          <div className="watch-controls-left">
            <button className="watch-control-btn" onClick={togglePlay}>
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              )}
            </button>
            <button className="watch-control-btn" onClick={toggleMute}>
              {muted || volume === 0 ? <HiVolumeOff size={20} /> : <HiVolumeUp size={20} />}
            </button>
            <div className="watch-volume-slider">
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolumeChange} />
            </div>
            <span className="watch-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <div className="watch-controls-right">
            {user && (
              <div className="watch-star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} className={`watch-star ${star <= userRating ? "active" : ""}`} onClick={() => handleRating(star)}>
                    <HiStar size={18} />
                  </button>
                ))}
              </div>
            )}
            <button className="watch-control-btn" onClick={handleFullscreen}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="watch-player-container">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="watch-video"
            onClick={togglePlay}
            onDoubleClick={handleFullscreen}
            onPlay={() => { setPlaying(true); setShowOverlay(false); }}
            onPause={() => { setPlaying(false); setShowOverlay(true); }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
          />
        ) : (
          <div className="watch-placeholder">
            <div className="watch-placeholder-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <h3>No video available</h3>
            <p>The video file for this content has not been uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
