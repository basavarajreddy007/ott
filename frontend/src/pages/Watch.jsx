import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { HiArrowLeft, HiStar, HiVolumeUp, HiVolumeOff, HiThumbUp, HiThumbDown, HiTrash, HiPlay } from "react-icons/hi";
import { HiCheckBadge } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { movieAPI, tvShowAPI, webSeriesAPI, historyAPI, ratingAPI, reviewAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useSubscription } from "../hooks/useSubscription";
import SubscribeButton from "../components/common/SubscribeButton";
import JoinMembershipModal from "../components/common/JoinMembershipModal";
import CinematicPlayer from "../components/player/CinematicPlayer";
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
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  const channelId = content?.channel?._id || content?.uploadedBy?._id;
  const { isSubscribed, subscribe } = useSubscription(channelId, {
    isSubscribed: false,
    subscribersCount: content?.channel?.subscribersCount || 0
  });

  useEffect(() => {
    if (content) {
      const initialCount = content?.channel?.subscribersCount || content?.uploadedBy?.subscribersCount || 0;
      setSubscriberCount(initialCount);
    }
  }, [content]);

  const handleJoinClick = async () => {
    if (isJoined) {
      setIsJoined(false);
      setSubscriberCount((prev) => Math.max(0, prev - 1));
      toast.success("Un-joined channel");
    } else {
      setIsJoined(true);
      setSubscriberCount((prev) => prev + 1);
      toast.success("Joined channel!");
    }

    if (channelId && user && !isSubscribed && !isJoined) {
      try {
        await subscribe("all");
      } catch (err) {
        console.error(err);
      }
    }
  };

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
      const resData = data.data || {};
      const likesArr = Array.isArray(resData.likes) ? resData.likes : [];
      const dislikesArr = Array.isArray(resData.dislikes) ? resData.dislikes : [];
      setLikesCount(resData.likesCount !== undefined ? resData.likesCount : likesArr.length);
      setDislikesCount(resData.dislikesCount !== undefined ? resData.dislikesCount : dislikesArr.length);
      setUserLiked(likesArr.includes(user._id));
      setUserDisliked(dislikesArr.includes(user._id));
    } catch {
      toast.error("Failed to submit review interaction");
    }
  };

  const handleDislike = async () => {
    if (!user) return toast.error("Please sign in to dislike this video");
    if (type !== "Movie") return;
    try {
      const { data } = await movieAPI.dislike(content._id);
      const resData = data.data || {};
      const likesArr = Array.isArray(resData.likes) ? resData.likes : [];
      const dislikesArr = Array.isArray(resData.dislikes) ? resData.dislikes : [];
      setLikesCount(resData.likesCount !== undefined ? resData.likesCount : likesArr.length);
      setDislikesCount(resData.dislikesCount !== undefined ? resData.dislikesCount : dislikesArr.length);
      setUserLiked(likesArr.includes(user._id));
      setUserDisliked(dislikesArr.includes(user._id));
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
      const { data } = await reviewAPI.create({
        contentId: content._id,
        contentType: type,
        review: newCommentText.trim(),
        rating: userRating || 5
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
          <div className="watch-cinematic-player-box" style={{ width: "100%", marginBottom: "24px" }}>
            <CinematicPlayer
              videoUrl={videoUrl}
              title={content?.title || "Watch"}
              seasonNumber={season ? parseInt(season) : undefined}
              episodeNumber={episode ? parseInt(episode) : undefined}
              seasons={content?.seasons || []}
              nextEpisode={
                similarList[0]
                  ? {
                      title: similarList[0].title,
                      seasonNumber: season ? parseInt(season) : 1,
                      episodeNumber: episode ? parseInt(episode) + 1 : 2,
                      thumbnail: similarList[0].poster?.url || similarList[0].banner?.url
                    }
                  : null
              }
              onBack={() => navigate(-1)}
              onPlayNextEpisode={(sNum, epNum) => {
                if (type === "Movie" && similarList[0]?.slug) {
                  navigate(`/watch/Movie/${similarList[0].slug}`);
                } else {
                  navigate(`/watch/${type}/${slug}?season=${sNum}&episode=${epNum}`);
                }
              }}
            />
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

            <div className="watch-creator-bar glass">
              <div className="creator-bar-left">
                <Link to={content?.channel?.slug ? `/channel/${content.channel.slug}` : "#"} className="creator-avatar-link">
                  <div className="creator-avatar-wrap">
                    {content?.channel?.avatar || content?.uploadedBy?.avatar ? (
                      <img src={content?.channel?.avatar || content?.uploadedBy?.avatar} alt="" />
                    ) : (
                      <span>{(content?.channel?.name || content?.uploadedBy?.name || "C")?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                </Link>

                <div className="creator-meta">
                  <Link to={content?.channel?.slug ? `/channel/${content.channel.slug}` : "#"} className="creator-name-link">
                    <h4>{content?.channel?.name || content?.uploadedBy?.name || "Official Channel"}</h4>
                    {(content?.channel?.verifiedBadge || content?.uploadedBy?.role === "admin") && (
                      <HiCheckBadge className="creator-verified-badge" />
                    )}
                  </Link>
                  <span className="creator-subs-count">
                    {`${subscriberCount.toLocaleString()} subscribers`}
                  </span>
                </div>
              </div>

              <div className="creator-bar-actions">
                <button
                  className={`watch-join-btn ${isJoined ? "active" : ""}`}
                  onClick={handleJoinClick}
                >
                  {isJoined ? "Joined ✓" : "Join"}
                </button>

                {(content?.channel?._id || content?.uploadedBy?._id) && (
                  <SubscribeButton
                    channelId={content?.channel?._id || content?.uploadedBy?._id}
                    initialSubscribersCount={content?.channel?.subscribersCount || 0}
                  />
                )}
              </div>
            </div>

            <JoinMembershipModal
              channelId={content?.channel?._id || content?.uploadedBy?._id}
              channelName={content?.channel?.name || content?.uploadedBy?.name}
              isOpen={showJoinModal}
              onClose={() => setShowJoinModal(false)}
            />

            <div className="watch-description-box">
              <p>{content?.description}</p>
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
