import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { HiArrowLeft, HiStar, HiVolumeUp, HiVolumeOff, HiThumbUp, HiThumbDown, HiTrash, HiPlay } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { movieAPI, tvShowAPI, webSeriesAPI, historyAPI, ratingAPI, reviewAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { playerControlsVariants, playButtonPulseVariants } from "../animations";
import toast from "react-hot-toast";
import "../css/Watch.css";

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

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
  const youtubeId = getYouTubeId(videoUrl);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);

  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [similarList, setSimilarList] = useState([]);

  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  useEffect(() => {
    setVideoUrl("");
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setBuffering(false);
    setError(false);
    setShowOverlay(true);
    setContent(null);
    setLoading(true);
    setComments([]);
    setSimilarList([]);
    setUserRating(0);
    setLikesCount(0);
    setDislikesCount(0);
    setUserLiked(false);
    setUserDisliked(false);
  }, [type, slug, season, episode]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        let data;
        if (type === "Movie") {
          const res = await movieAPI.getBySlug(slug);
          data = res.data.data;
          setVideoUrl(data.video?.url || data.trailer?.url || "");
          setLikesCount(data.likes?.length || 0);
          setDislikesCount(data.dislikes?.length || 0);
          if (user) {
            setUserLiked(data.likes?.includes(user._id));
            setUserDisliked(data.dislikes?.includes(user._id));
          }
          movieAPI.getSimilar(data._id)
            .then(({ data: simData }) => setSimilarList(simData.data || []))
            .catch((err) => console.error(err));
        } else if (type === "TvShow" || type === "WebSeries") {
          const api = type === "TvShow" ? tvShowAPI : webSeriesAPI;
          const res = await api.getBySlug(slug);
          data = res.data.data;
          if (!season || !episode) {
            const firstSeason = data.seasons?.[0];
            const firstEpisode = firstSeason?.episodes?.[0];
            if (firstSeason && firstEpisode) {
              navigate(`/watch/${type}/${slug}?season=${firstSeason.seasonNumber}&episode=${firstEpisode.episodeNumber}`, { replace: true });
              return;
            }
          }
          const ep = data.seasons?.find(s => s.seasonNumber === parseInt(season))?.episodes?.find(e => e.episodeNumber === parseInt(episode));
          setVideoUrl(ep?.video?.url || "");
          api.getAll({ limit: 10 })
            .then(({ data: simData }) => setSimilarList((simData.data || []).filter(s => s._id !== data._id)))
            .catch((err) => console.error(err));
        }
        setContent(data);
        if (data) {
          reviewAPI.getByContent(type, data._id)
            .then(({ data: revData }) => setComments(revData.data || []))
            .catch((err) => console.error(err));
        }
        if (user && data) {
          ratingAPI.getRating(data._id, type)
            .then(({ data: rd }) => {
              if (rd?.data) setUserRating(rd.data.rating);
            })
            .catch(() => setUserRating(0));
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load content details. Please try again.");
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [type, slug, season, episode, user, navigate]);

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

  const handleKeyDown = (e) => {
    if (
      !videoRef.current ||
      document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "TEXTAREA" ||
      document.activeElement.isContentEditable
    ) {
      return;
    }
    switch (e.key.toLowerCase()) {
      case " ":
      case "k":
        e.preventDefault();
        togglePlay();
        break;
      case "arrowleft":
        e.preventDefault();
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        showControlsTemporarily();
        break;
      case "arrowright":
        e.preventDefault();
        videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
        showControlsTemporarily();
        break;
      case "arrowup":
        e.preventDefault();
        const newVolUp = Math.min(1, videoRef.current.volume + 0.1);
        videoRef.current.volume = newVolUp;
        setVolume(newVolUp);
        setMuted(newVolUp === 0);
        if (videoRef.current.muted && newVolUp > 0) {
          videoRef.current.muted = false;
        }
        showControlsTemporarily();
        break;
      case "arrowdown":
        e.preventDefault();
        const newVolDown = Math.max(0, videoRef.current.volume - 0.1);
        videoRef.current.volume = newVolDown;
        setVolume(newVolDown);
        setMuted(newVolDown === 0);
        showControlsTemporarily();
        break;
      case "f":
        e.preventDefault();
        handleFullscreen();
        break;
      case "m":
        e.preventDefault();
        toggleMute();
        showControlsTemporarily();
        break;
      default:
        break;
    }
  };

  const handleKeyDownRef = useRef(handleKeyDown);

  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  });

  useEffect(() => {
    const listener = (e) => {
      if (handleKeyDownRef.current) {
        handleKeyDownRef.current(e);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const showControlsTemporarily = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => {
          setPlaying(true);
          setShowOverlay(false);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to start video playback. Please click to try again.");
          setPlaying(false);
          setShowOverlay(true);
        });
    } else {
      videoRef.current.pause();
      setPlaying(false);
      setShowOverlay(true);
    }
    showControlsTemporarily();
  };

  const handleRetry = () => {
    setError(false);
    setBuffering(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play()
        .then(() => {
          setBuffering(false);
        })
        .catch(err => {
          console.error(err);
          setBuffering(false);
          setError(true);
          toast.error("Retry failed. Please check your file or connection.");
        });
    }
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

  const handleLike = async () => {
    if (!user) return toast.error("Please sign in to like this video");
    if (type !== "Movie") return;
    try {
      const { data } = await movieAPI.like(content._id);
      setLikesCount(data.data.likes?.length || 0);
      setDislikesCount(data.data.dislikes?.length || 0);
      setUserLiked(data.data.likes?.includes(user._id));
      setUserDisliked(data.data.dislikes?.includes(user._id));
    } catch {
      toast.error("Failed to submit review interaction");
    }
  };

  const handleDislike = async () => {
    if (!user) return toast.error("Please sign in to dislike this video");
    if (type !== "Movie") return;
    try {
      const { data } = await movieAPI.dislike(content._id);
      setLikesCount(data.data.likes?.length || 0);
      setDislikesCount(data.data.dislikes?.length || 0);
      setUserLiked(data.data.likes?.includes(user._id));
      setUserDisliked(data.data.dislikes?.includes(user._id));
    } catch {
      toast.error("Failed to submit review interaction");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || newCommentText.trim().length < 10) {
      return toast.error("Comment must be at least 10 characters long");
    }
    setSubmittingComment(true);
    try {
      const { data } = await reviewAPI.add({
        contentId: content._id,
        contentType: type,
        review: newCommentText.trim()
      });
      setComments((prev) => [data.data, ...prev]);
      setNewCommentText("");
      toast.success("Comment added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await reviewAPI.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <div className="watch-loading">
        <div className="watch-loading-spinner" />
      </div>
    );
  }

  const detailPath = type === "Movie" ? `/movies/${slug}` : type === "TvShow" ? `/tv-shows/${slug}` : `/web-series/${slug}`;
  const sidebarType = type;

  return (
    <div className="watch-page-container">
      <div className="watch-layout">
        <div className="watch-main-content">
          <div className="watch-player-wrapper" ref={containerRef} onMouseMove={showControlsTemporarily}>
            {youtubeId ? (
              <div className="watch-iframe-wrapper" style={{ width: "100%", height: "100%", position: "relative" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  className="watch-video"
                  style={{ border: "none", width: "100%", height: "100%" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={content?.title || "Video"}
                />
                <button onClick={() => navigate(-1)} className="watch-back-floating" style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  cursor: "pointer",
                  zIndex: 10,
                  transition: "background 0.2s"
                }}>
                  <HiArrowLeft size={20} />
                </button>
              </div>
            ) : content?.isLocked ? (
              <div className="watch-player-locked">
                <button onClick={() => navigate(-1)} className="watch-back-floating" style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  cursor: "pointer",
                  zIndex: 10,
                  transition: "background 0.2s"
                }}>
                  <HiArrowLeft size={20} />
                </button>
                <div className="watch-player-locked-icon">🔒</div>
                <h3>Subscription Required</h3>
                <p>This video is exclusive to subscribers. Please upgrade your plan to unlock premium content.</p>
                <Link to="/subscription" className="watch-subscribe-btn">
                  Upgrade Subscription
                </Link>
              </div>
            ) : (
              <>
                {error ? (
                  <div className="watch-player-error">
                    <button onClick={() => navigate(-1)} className="watch-back-floating" style={{
                      position: "absolute",
                      top: "20px",
                      left: "20px",
                      background: "rgba(0, 0, 0, 0.6)",
                      border: "none",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      cursor: "pointer",
                      zIndex: 10,
                      transition: "background 0.2s"
                    }}>
                      <HiArrowLeft size={20} />
                    </button>
                    <div className="watch-player-error-icon">⚠️</div>
                    <h3>Playback Error</h3>
                    <p>We encountered an issue loading this video file. Please check your network or try again.</p>
                    <button className="watch-retry-btn" onClick={handleRetry}>
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    <AnimatePresence>
                      {showOverlay && !playing && (
                        <motion.div
                          className="watch-overlay visible"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          onClick={togglePlay}
                        >
                          <div className="watch-overlay-bg" />
                          <div className="watch-overlay-content" onClick={(e) => e.stopPropagation()}>
                            <motion.button
                              className="watch-play-btn"
                              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                              variants={playButtonPulseVariants}
                              animate="pulse"
                              whileHover="hover"
                              whileTap="tap"
                            >
                              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                <circle cx="40" cy="40" r="38" stroke="white" strokeWidth="2" opacity="0.8" />
                                <path d="M33 28L55 40L33 52V28Z" fill="white" />
                              </svg>
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {buffering && (
                      <div className="watch-player-buffering">
                        <div className="watch-player-buffering-spinner" />
                        <span>Buffering...</span>
                      </div>
                    )}

                    <AnimatePresence>
                      {showControls && (
                        <motion.div
                          className="watch-controls visible"
                          variants={playerControlsVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <div className="watch-nav">
                            <button onClick={() => navigate(-1)} className="watch-back">
                              <HiArrowLeft />
                            </button>
                            <span className="watch-nav-title">{content?.title}{episode ? ` - S${season}:E${episode}` : ""}</span>
                          </div>

                          <div className="watch-progress-bar" onClick={handleSeek}>
                            <div className="watch-progress-track">
                              <motion.div
                                className="watch-progress-fill"
                                style={{
                                  scaleX: progress / 100,
                                  transformOrigin: "left",
                                  width: "100%"
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
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
                              <motion.div
                                className="watch-volume-slider"
                                whileHover={{ width: 90 }}
                                transition={{ duration: 0.2 }}
                              >
                                <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolumeChange} />
                              </motion.div>
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {videoUrl ? (
                  <video
                    key={videoUrl}
                    ref={videoRef}
                    src={videoUrl || undefined}
                    className="watch-video"
                    onClick={togglePlay}
                    onDoubleClick={handleFullscreen}
                    onPlay={() => { setPlaying(true); setShowOverlay(false); }}
                    onPause={() => { setPlaying(false); setShowOverlay(true); }}
                    onWaiting={() => setBuffering(true)}
                    onPlaying={() => { setBuffering(false); setError(false); }}
                    onCanPlay={() => setBuffering(false)}
                    onSeeking={() => setBuffering(true)}
                    onSeeked={() => setBuffering(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onError={(e) => {
                      const vid = e.target;
                      const err = vid.error;
                      console.error("Video error:", err?.code, err?.message, "src:", vid.src);
                      setError(true);
                      setBuffering(false);
                      toast.error("Failed to load video file. Please check your connection or try again later.");
                    }}
                  />
                ) : (
                  <div className="watch-placeholder">
                    <button onClick={() => navigate(-1)} className="watch-back-floating" style={{
                      position: "absolute",
                      top: "20px",
                      left: "20px",
                      background: "rgba(0, 0, 0, 0.6)",
                      border: "none",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      cursor: "pointer",
                      zIndex: 10,
                      transition: "background 0.2s"
                    }}>
                      <HiArrowLeft size={20} />
                    </button>
                    <div className="watch-placeholder-icon">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                    <h3>No video available</h3>
                    <p>The video file for this content has not been uploaded yet.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="watch-video-details">
            <h1 className="watch-video-title">{content?.title}</h1>
            <div className="watch-meta-actions">
              <div className="watch-video-meta">
                {content?.releaseYear && <span>{content.releaseYear}</span>}
                {content?.quality && <span className="quality-badge">{content.quality}</span>}
                {content?.language && <span>{content.language}</span>}
                {content?.genres?.map(g => <span key={g._id || g} className="genre-chip-sm">{g.name || g}</span>)}
              </div>

              {type === "Movie" && (
                <div className="watch-like-actions">
                  <button className={`like-btn ${userLiked ? "active" : ""}`} onClick={handleLike} title="Like">
                    <HiThumbUp /> <span>{likesCount}</span>
                  </button>
                  <button className={`dislike-btn ${userDisliked ? "active" : ""}`} onClick={handleDislike} title="Dislike">
                    <HiThumbDown /> <span>{dislikesCount}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="watch-description-box">
              <p>{content?.description}</p>
            </div>
          </div>

          <div className="watch-comments-section">
            <h3>{comments.length} Comment{comments.length !== 1 ? "s" : ""}</h3>
            {user ? (
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <textarea
                  placeholder="Add a public comment (minimum 10 characters)..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  required
                />
                <button type="submit" disabled={submittingComment}>
                  {submittingComment ? "Posting..." : "Comment"}
                </button>
              </form>
            ) : (
              <p className="login-prompt">Please <Link to="/login">Sign In</Link> to join the discussion.</p>
            )}

            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment._id} className="comment-item">
                  <div className="comment-avatar">
                    {comment.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{comment.user?.name || "Anonymous"}</span>
                      <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      {user && (user._id === comment.user?._id || user.role === "admin") && (
                        <button className="delete-comment-btn" onClick={() => handleCommentDelete(comment._id)}>
                          <HiTrash /> Delete
                        </button>
                      )}
                    </div>
                    <p className="comment-text">{comment.review}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="watch-sidebar">
          <h3>Up Next</h3>
          <div className="similar-list">
            {similarList.length === 0 ? (
              <p className="no-similar-text">No similar content found</p>
            ) : (
              similarList.map((item) => {
                const itemSlug = item.slug;
                const path = sidebarType === "Movie"
                  ? `/watch/Movie/${itemSlug}`
                  : sidebarType === "TvShow"
                  ? `/watch/TvShow/${itemSlug}?season=1&episode=1`
                  : `/watch/WebSeries/${itemSlug}?season=1&episode=1`;
                return (
                  <Link key={item._id} to={path} className="similar-item-card">
                    {item.poster?.url ? (
                      <div className="similar-item-poster-wrap">
                        <img src={item.poster.url} alt={item.title} className="similar-item-poster" />
                        <div className="similar-item-play">
                          <HiPlay size={24} />
                        </div>
                      </div>
                    ) : (
                      <div className="similar-item-poster-placeholder">
                        <HiPlay size={20} />
                      </div>
                    )}
                    <div className="similar-item-info">
                      <h4 className="similar-item-title">{item.title}</h4>
                      <div className="similar-item-meta">
                        {item.releaseYear && <span>{item.releaseYear}</span>}
                        {item.quality && <span className="quality-badge-sm">{item.quality}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
