import { useState } from "react";
import { aiAPI } from "../../services/ai";
import ErrorBanner from "../common/ErrorBanner";
import "../../css/MoodSection.css";

const moods = [
  { id: "happy", label: "Happy", emoji: "😊", color: "#FFD54F", bg: "rgba(255,213,79,0.12)" },
  { id: "sad", label: "Sad", emoji: "😢", color: "#64B5F6", bg: "rgba(100,181,246,0.12)" },
  { id: "excited", label: "Excited", emoji: "🤩", color: "#FF8A65", bg: "rgba(255,138,101,0.12)" },
  { id: "romantic", label: "Romantic", emoji: "❤️", color: "#F48FB1", bg: "rgba(244,143,177,0.12)" },
  { id: "thriller", label: "Thriller", emoji: "😱", color: "#CE93D8", bg: "rgba(206,147,216,0.12)" },
  { id: "chill", label: "Chill", emoji: "😌", color: "#81C784", bg: "rgba(129,199,132,0.12)" },
  { id: "nostalgic", label: "Nostalgic", emoji: "🥹", color: "#FFAB91", bg: "rgba(255,171,145,0.12)" },
  { id: "adventurous", label: "Adventurous", emoji: "🗺️", color: "#AED581", bg: "rgba(174,213,129,0.12)" },
];

const genreColors = {
  Action: "#E50914", Comedy: "#FFD54F", Drama: "#64B5F6",
  Horror: "#CE93D8", Romance: "#F48FB1", Thriller: "#FF8A65",
  SciFi: "#81C784", Adventure: "#AED581", Fantasy: "#FFAB91",
  Mystery: "#90CAF9", Documentary: "#A1887F", Animation: "#FFD54F",
};

export default function MoodSection({ onMoodSelect }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);

  const handleMoodClick = async (mood) => {
    setSelectedMood(mood);
    setLoading(true);
    setError(null);
    setRecommendations([]);
    onMoodSelect?.(mood);

    try {
      const { data } = await aiAPI.moodRecommend(mood.id);
      if (data.data?.recommendations?.length) {
        setRecommendations(data.data.recommendations);
      } else {
        setError("Could not parse recommendations. Try another mood.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mood-section">
      <div className="section-header">
        <h2 className="section-title">What's Your Mood?</h2>
        <span className="mood-subtitle">Get movie recommendations based on how you feel</span>
      </div>

      <ErrorBanner message={error} type="error" onDismiss={() => setError(null)} />

      <div className="mood-grid">
        {moods.map((mood) => (
          <button
            key={mood.id}
            className={`mood-btn ${selectedMood?.id === mood.id ? "active" : ""} ${loading ? "disabled" : ""}`}
            onClick={() => handleMoodClick(mood)}
            disabled={loading}
            style={{
              "--mood-color": mood.color,
              "--mood-bg": mood.bg,
            }}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-label">{mood.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="mood-loading">
          <div className="mood-loading-spinner" />
          <span>Finding the perfect picks for your mood...</span>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mood-recommendations">
          <div className="mood-recs-header">
            <h3>Recommended for "{selectedMood?.label}"</h3>
            <span className="mood-recs-count">{recommendations.length} picks</span>
          </div>
          <div className="mood-cards">
            {recommendations.map((movie, i) => (
              <div key={i} className="mood-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="mood-card-poster" style={{ background: `linear-gradient(135deg, ${genreColors[movie.genre] || "#E50914"}, ${genreColors[movie.genre] || "#E50914"}88)` }}>
                  <span className="mood-card-poster-text">{movie.title?.[0] || "?"}</span>
                  <div className="mood-card-year">{movie.year}</div>
                </div>
                <div className="mood-card-body">
                  <h4 className="mood-card-title">{movie.title}</h4>
                  <span className="mood-card-genre">{movie.genre}</span>
                  <p className="mood-card-desc">{movie.description}</p>
                  <p className="mood-card-reason">{movie.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMood && !loading && recommendations.length === 0 && !error && (
        <div className="mood-empty">
          <p>No recommendations found for this mood. Try another!</p>
        </div>
      )}
    </section>
  );
}
