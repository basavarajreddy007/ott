import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX, HiCheck, HiChevronRight, HiCog, HiGlobe, HiFilm, HiFastForward } from "react-icons/hi";

const QUALITY_OPTIONS = [
  { id: "auto", label: "Auto (4K Ultra HD)", sub: "Best available quality" },
  { id: "2160p", label: "2160p (4K HDR)", sub: "3840 x 2160 • High Bitrate" },
  { id: "1080p", label: "1080p (Full HD)", sub: "1920 x 1080 • Standard" },
  { id: "720p", label: "720p (HD)", sub: "1280 x 720 • Data Saver" },
  { id: "480p", label: "480p (SD)", sub: "854 x 480 • Low Data" },
];

const AUDIO_OPTIONS = [
  { id: "en-atmos", label: "English [Original]", sub: "Dolby Atmos 7.1" },
  { id: "es-51", label: "Spanish (Español)", sub: "5.1 Surround" },
  { id: "fr-51", label: "French (Français)", sub: "5.1 Surround" },
  { id: "hi-51", label: "Hindi (हिन्दी)", sub: "5.1 Surround" },
  { id: "de-20", label: "German (Deutsch)", sub: "Stereo 2.0" },
];

const SUBTITLE_OPTIONS = [
  { id: "off", label: "Off" },
  { id: "en", label: "English [CC]" },
  { id: "es", label: "Spanish (Español)" },
  { id: "fr", label: "French (Français)" },
  { id: "de", label: "German (Deutsch)" },
  { id: "hi", label: "Hindi (हिन्दी)" },
];

const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1.0, label: "1.0x (Normal)" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 2.0, label: "2.0x" },
];

export default function PlayerSettingsModal({
  isOpen,
  onClose,
  currentQuality = "auto",
  onQualityChange,
  currentAudio = "en-atmos",
  onAudioChange,
  currentSubtitle = "off",
  onSubtitleChange,
  playbackSpeed = 1.0,
  onSpeedChange
}) {
  const [activeTab, setActiveTab] = useState("main");

  if (!isOpen) return null;

  const renderMainMenu = () => (
    <div>
      <div className="settings-header">
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HiCog style={{ color: "#00A8FF" }} /> Player Settings
        </span>
        <button className="player-btn" onClick={onClose} style={{ width: 28, height: 28, fontSize: 16 }}>
          <HiX />
        </button>
      </div>

      <div className="settings-option-item" onClick={() => setActiveTab("quality")}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HiFilm /> Quality
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#00A8FF", fontSize: "0.8rem" }}>
          {QUALITY_OPTIONS.find(q => q.id === currentQuality)?.label || "Auto"} <HiChevronRight />
        </span>
      </div>

      <div className="settings-option-item" onClick={() => setActiveTab("audio")}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HiGlobe /> Audio Language
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#00A8FF", fontSize: "0.8rem" }}>
          {AUDIO_OPTIONS.find(a => a.id === currentAudio)?.label || "English"} <HiChevronRight />
        </span>
      </div>

      <div className="settings-option-item" onClick={() => setActiveTab("subtitles")}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HiGlobe /> Subtitles
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#00A8FF", fontSize: "0.8rem" }}>
          {SUBTITLE_OPTIONS.find(s => s.id === currentSubtitle)?.label || "Off"} <HiChevronRight />
        </span>
      </div>

      <div className="settings-option-item" onClick={() => setActiveTab("speed")}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HiFastForward /> Playback Speed
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#00A8FF", fontSize: "0.8rem" }}>
          {playbackSpeed}x <HiChevronRight />
        </span>
      </div>
    </div>
  );

  const renderSubMenu = (title, items, currentVal, selectHandler) => (
    <div>
      <div className="settings-header">
        <button
          className="player-btn"
          onClick={() => setActiveTab("main")}
          style={{ width: 28, height: 28, fontSize: 16 }}
        >
          ←
        </button>
        <span>{title}</span>
        <div style={{ width: 28 }} />
      </div>

      <div style={{ maxHeight: "240px", overflowY: "auto" }}>
        {items.map((item) => {
          const itemVal = item.id || item.value;
          const isSelected = itemVal === currentVal;
          return (
            <div
              key={itemVal}
              className={`settings-option-item ${isSelected ? "active" : ""}`}
              onClick={() => {
                selectHandler(itemVal);
                setActiveTab("main");
              }}
            >
              <div>
                <div style={{ fontWeight: isSelected ? 700 : 500 }}>{item.label}</div>
                {item.sub && <div style={{ fontSize: "0.72rem", color: "#a0a5b5" }}>{item.sub}</div>}
              </div>
              {isSelected && <HiCheck style={{ color: "#00A8FF" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        className="player-settings-popup"
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {activeTab === "main" && renderMainMenu()}
        {activeTab === "quality" && renderSubMenu("Video Quality", QUALITY_OPTIONS, currentQuality, onQualityChange)}
        {activeTab === "audio" && renderSubMenu("Audio Track", AUDIO_OPTIONS, currentAudio, onAudioChange)}
        {activeTab === "subtitles" && renderSubMenu("Subtitles", SUBTITLE_OPTIONS, currentSubtitle, onSubtitleChange)}
        {activeTab === "speed" && renderSubMenu("Playback Speed", SPEED_OPTIONS, playbackSpeed, onSpeedChange)}
      </motion.div>
    </AnimatePresence>
  );
}
