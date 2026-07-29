import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlayerControls from "./PlayerControls";
import PlayerSettingsModal from "./PlayerSettingsModal";
import EpisodeDrawer from "./EpisodeDrawer";
import NextEpisodeCard from "./NextEpisodeCard";
import "../../css/CinematicPlayer.css";

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export default function CinematicPlayer({
  videoUrl = "",
  title = "Untitled Production",
  seasonNumber,
  episodeNumber,
  seasons = [],
  nextEpisode,
  onPlayNextEpisode,
  onBack,
  onEnded,
  introRange = { start: 10, end: 90 },
  recapRange = { start: 90, end: 150 }
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const youtubeId = getYouTubeId(videoUrl);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [quality, setQuality] = useState("auto");
  const [audioTrack, setAudioTrack] = useState("en-atmos");
  const [subtitleTrack, setSubtitleTrack] = useState("off");
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const [showNextEpCard, setShowNextEpCard] = useState(false);

  const [touchRipple, setTouchRipple] = useState(null);
  const lastTapRef = useRef({ time: 0, x: 0 });

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing && !showSettingsModal && !showEpisodeDrawer) {
        setShowControls(false);
      }
    }, 3200);
  }, [playing, showSettingsModal, showEpisodeDrawer]);

  useEffect(() => {
    resetControlsTimer();
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [resetControlsTimer]);

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleSeek = (timeSecs) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timeSecs;
    setCurrentTime(timeSecs);
  };

  const handleVolumeChange = (newVol) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setMuted(newVol === 0);
    if (newVol > 0 && videoRef.current.muted) {
      videoRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleTheater = () => {
    setIsTheater((prev) => !prev);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          resetControlsTimer();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          resetControlsTimer();
          break;
        case "j":
        case "arrowleft":
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 10));
          resetControlsTimer();
          break;
        case "l":
        case "arrowright":
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 10));
          resetControlsTimer();
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          resetControlsTimer();
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          resetControlsTimer();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, volume, playing]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);

    if (videoRef.current.buffered.length > 0) {
      const bufEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufEnd / dur) * 100);
    }

    if (dur > 0 && dur - cur <= 30 && nextEpisode && !showNextEpCard) {
      setShowNextEpCard(true);
    }
  };

  const handleTouchStart = (e) => {
    const now = Date.now();
    const touchX = e.touches[0].clientX;
    const timeDiff = now - lastTapRef.current.time;
    if (timeDiff < 300) {
      const rect = containerRef.current.getBoundingClientRect();
      const halfWidth = rect.width / 2;
      if (touchX - rect.left < halfWidth) {
        handleSeek(Math.max(0, currentTime - 10));
        setTouchRipple("left");
      } else {
        handleSeek(Math.min(duration, currentTime + 10));
        setTouchRipple("right");
      }
      setTimeout(() => setTouchRipple(null), 600);
    }
    lastTapRef.current = { time: now, x: touchX };
    resetControlsTimer();
  };

  const showSkipIntro = currentTime >= introRange.start && currentTime <= introRange.end;
  const showSkipRecap = currentTime >= recapRange.start && currentTime <= recapRange.end;

  return (
    <div
      ref={containerRef}
      className={`cinematic-player-root ${isTheater ? "is-theater" : ""} ${isFullscreen ? "is-fullscreen" : ""}`}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
    >
      <div className="player-ambient-glow" />

      {youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
          className="cinematic-video-element"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          className="cinematic-video-element"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={onEnded}
          playsInline
        />
      )}

      {touchRipple && (
        <div className={`touch-gesture-ripple ${touchRipple}`}>
          <span>{touchRipple === "left" ? "◀◀ 10s" : "10s ▶▶"}</span>
        </div>
      )}

      <PlayerControls
        title={title}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
        playing={playing}
        onTogglePlay={togglePlay}
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        volume={volume}
        muted={muted}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
        onSeek={handleSeek}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isTheater={isTheater}
        onToggleTheater={toggleTheater}
        onBack={onBack}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenEpisodes={seasons?.length > 0 ? () => setShowEpisodeDrawer(true) : null}
        showSkipIntro={showSkipIntro}
        onSkipIntro={() => handleSeek(introRange.end + 1)}
        showSkipRecap={showSkipRecap}
        onSkipRecap={() => handleSeek(recapRange.end + 1)}
        showControls={showControls || !playing}
      />

      <PlayerSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentQuality={quality}
        onQualityChange={setQuality}
        currentAudio={audioTrack}
        onAudioChange={setAudioTrack}
        currentSubtitle={subtitleTrack}
        onSubtitleChange={setSubtitleTrack}
        playbackSpeed={playbackSpeed}
        onSpeedChange={handleSpeedChange}
      />

      <EpisodeDrawer
        isOpen={showEpisodeDrawer}
        onClose={() => setShowEpisodeDrawer(false)}
        seasons={seasons}
        currentSeasonNumber={seasonNumber}
        currentEpisodeNumber={episodeNumber}
        onSelectEpisode={(sNum, epNum) => {
          if (onPlayNextEpisode) onPlayNextEpisode(sNum, epNum);
        }}
      />

      <NextEpisodeCard
        isVisible={showNextEpCard}
        nextEpisode={nextEpisode}
        onPlayNext={() => {
          setShowNextEpCard(false);
          if (onPlayNextEpisode) onPlayNextEpisode(nextEpisode.seasonNumber, nextEpisode.episodeNumber);
        }}
        onCancel={() => setShowNextEpCard(false)}
      />
    </div>
  );
}
