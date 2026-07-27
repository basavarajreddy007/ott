import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  { id: "nostalgic", label: "Nostalgic", emoji: "📼", color: "#FFAB91", bg: "rgba(255,171,145,0.12)" },
  { id: "adventurous", label: "Adventurous", emoji: "🗺️", color: "#AED581", bg: "rgba(174,213,129,0.12)" },
];

const moodHeadlines = {
  happy: "Showing picks to brighten your day",
  sad: "Showing emotional and comforting pick-me-ups",
  excited: "Showing high-energy, thrilling blockbusters",
  romantic: "Showing heartfelt romantic stories",
  thriller: "Showing intense, mind-bending thrillers",
  chill: "Showing low-stakes, relaxing titles to unwind",
  nostalgic: "Showing iconic classics and retro favorites",
  adventurous: "Showing epic sci-fi journeys and fantasy quests"
};

const moviePosters = {
  "Paddington 2": "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=600&q=80",
  "The Grand Budapest Hotel": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
  "Toy Story 3": "https://images.unsplash.com/photo-1559251606-c623743a6d76?auto=format&fit=crop&w=600&q=80",
  "Chef": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
  "Amélie": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80",
  "Singin' in the Rain": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
  "Good Will Hunting": "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=80",
  "The Pursuit of Happyness": "https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?auto=format&fit=crop&w=600&q=80",
  "Dead Poets Society": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80",
  "Forrest Gump": "https://images.unsplash.com/photo-1476137682422-3c93a513f515?auto=format&fit=crop&w=600&q=80",
  "The Intouchables": "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80",
  "A Beautiful Mind": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80",
  "Inception": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
  "The Dark Knight": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80",
  "Mad Max: Fury Road": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
  "Spider-Man: Into the Spider-Verse": "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80",
  "Baby Driver": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80",
  "Whiplash": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80",
  "Parasite": "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80",
  "Se7en": "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80",
  "Shutter Island": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80",
  "Prisoners": "https://images.unsplash.com/photo-1533928298208-27ff66555d8d?auto=format&fit=crop&w=600&q=80",
  "Get Out": "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80",
  "La La Land": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
  "About Time": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80",
  "The Notebook": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80",
  "Pride & Prejudice": "https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?auto=format&fit=crop&w=600&q=80",
  "Before Sunrise": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  "Crazy Rich Asians": "https://images.unsplash.com/photo-1542204172-e7052809d852?auto=format&fit=crop&w=600&q=80",
  "Back to the Future": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80",
  "Jurassic Park": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
  "The Matrix": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
  "The Lion King": "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80",
  "E.T. the Extra-Terrestrial": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80",
  "Home Alone": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
  "My Octopus Teacher": "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=600&q=80",
  "March of the Penguins": "https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&w=600&q=80",
  "Our Planet": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
  "Midnight in Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
  "Little Miss Sunshine": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
  "The Secret Life of Walter Mitty": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
  "Interstellar": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  "The Lord of the Rings: The Fellowship of the Ring": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
  "Avatar": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
  "Life of Pi": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  "Dune": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80",
  "Spirited Away": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"
};

const genrePosters = {
  Action: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
  Comedy: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&q=80",
  Drama: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
  Horror: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80",
  Romance: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80",
  Thriller: "https://images.unsplash.com/photo-1533928298208-27ff66555d8d?auto=format&fit=crop&w=600&q=80",
  SciFi: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  Adventure: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
  Fantasy: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
  Mystery: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80",
  Documentary: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
  Animation: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
};

const getMoviePoster = (title, genre) => {
  return moviePosters[title] || genrePosters[genre] || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
};

const movieTags = {
  "Paddington 2": ["#FeelGood", "#Whimsical", "#Family"],
  "The Grand Budapest Hotel": ["#Aesthetic", "#Witty", "#Whimsical"],
  "Toy Story 3": ["#Nostalgic", "#Heartwarming", "#Adventure"],
  "Chef": ["#ComfortFood", "#Uplifting", "#Family"],
  "Amélie": ["#Quirky", "#Charming", "#Romance"],
  "Singin' in the Rain": ["#Classic", "#Joyous", "#Musical"],
  "Good Will Hunting": ["#Emotional", "#Healing", "#Inspirational"],
  "The Pursuit of Happyness": ["#Perseverance", "#Inspiring", "#Heartfelt"],
  "Dead Poets Society": ["#Poetic", "#Classic", "#Inspiring"],
  "Forrest Gump": ["#Classic", "#Cozy", "#Heartwarming"],
  "The Intouchables": ["#Friendship", "#Heartwarming", "#Comedy"],
  "A Beautiful Mind": ["#Resilience", "#Intellect", "#Triumphant"],
  "Inception": ["#MindBending", "#SciFi", "#Heist"],
  "The Dark Knight": ["#Action", "#Gritty", "#SuperHero"],
  "Mad Max: Fury Road": ["#Adrenaline", "#Action", "#SciFi"],
  "Spider-Man: Into the Spider-Verse": ["#Energetic", "#Stylized", "#Action"],
  "Baby Driver": ["#Stylish", "#Action", "#Music"],
  "Whiplash": ["#Intense", "#Drama", "#Obsession"],
  "Parasite": ["#Suspenseful", "#Thriller", "#SocialSatire"],
  "Se7en": ["#Dark", "#Mystery", "#Thriller"],
  "Shutter Island": ["#Psychological", "#Mystery", "#Thriller"],
  "Prisoners": ["#Intense", "#Mystery", "#Thriller"],
  "Get Out": ["#Chilling", "#Psychological", "#SocialThriller"],
  "La La Land": ["#Musical", "#Romance", "#Dreamy"],
  "About Time": ["#Heartwarming", "#Romance", "#TimeTravel"],
  "The Notebook": ["#ClassicRomance", "#Emotional", "#Drama"],
  "Pride & Prejudice": ["#PeriodDrama", "#Romance", "#Classic"],
  "Before Sunrise": ["#Indie", "#Romance", "#Dialogue"],
  "Crazy Rich Asians": ["#Glamorous", "#Romance", "#Comedy"],
  "Back to the Future": ["#Retro", "#TimeTravel", "#Adventure"],
  "Jurassic Park": ["#Nostalgic", "#Adventure", "#SciFi"],
  "The Matrix": ["#RetroSciFi", "#Action", "#Cyberpunk"],
  "The Lion King": ["#Childhood", "#Classic", "#Musical"],
  "E.T. the Extra-Terrestrial": ["#Heartfelt", "#Retro", "#SciFi"],
  "Home Alone": ["#HolidayClassic", "#Retro", "#Comedy"],
  "My Octopus Teacher": ["#Nature", "#Soothing", "#Relaxing"],
  "March of the Penguins": ["#Documentary", "#Nature", "#Relaxing"],
  "Our Planet": ["#Nature", "#Peaceful", "#Soothing"],
  "Midnight in Paris": ["#Whimsical", "#Romantic", "#TimeTravel"],
  "Little Miss Sunshine": ["#Quirky", "#SliceOfLife", "#Comedy"],
  "The Secret Life of Walter Mitty": ["#VisualEscape", "#Chill", "#Adventure"],
  "Interstellar": ["#EpicSpace", "#MindBending", "#SciFi"],
  "The Lord of the Rings: The Fellowship of the Ring": ["#HighFantasy", "#EpicQuest", "#Adventure"],
  "Avatar": ["#SciFi", "#Immersive", "#Adventure"],
  "Life of Pi": ["#Survival", "#VisualWonder", "#Adventure"],
  "Dune": ["#EpicSciFi", "#Atmospheric", "#Adventure"],
  "Spirited Away": ["#Magical", "#Fantasy", "#Anime"]
};

const getMovieTags = (title, genre, moodLabel) => {
  return movieTags[title] || [`#${genre}`, `#${moodLabel || "Vibe"}`];
};

export default function MoodSection({ onMoodSelect }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [surpriseMovie, setSurpriseMovie] = useState(null);
  const [error, setError] = useState(null);

  const handleMoodClick = async (mood) => {
    setSelectedMood(mood);
    setLoading(true);
    setError(null);
    setRecommendations([]);
    setSurpriseMovie(null);
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

  const handleSurprisePick = () => {
    if (recommendations.length > 0) {
      const randomIndex = Math.floor(Math.random() * recommendations.length);
      setSurpriseMovie(recommendations[randomIndex]);
    }
  };

  return (
    <section className="mood-section">
      <div className="section-header">
        <h2 className="section-title">What's Your Mood?</h2>
        <span className="mood-subtitle">
          {selectedMood ? moodHeadlines[selectedMood.id] : "Get movie recommendations based on how you feel"}
        </span>
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

      <AnimatePresence mode="wait">
        {!loading && recommendations.length > 0 && (
          <motion.div
            className="mood-recommendations"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="mood-recs-header">
              <h3>Recommended for "{selectedMood?.label}"</h3>
              <div className="mood-recs-actions">
                <span className="mood-recs-count">{recommendations.length} picks</span>
                <button className="mood-shuffle-btn" onClick={handleSurprisePick}>
                  🎲 Surprise Pick
                </button>
              </div>
            </div>
            <div className="mood-cards">
              {recommendations.map((movie, i) => (
                <div key={i} className="mood-card" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="mood-card-poster">
                    <img
                      src={getMoviePoster(movie.title, movie.genre)}
                      alt={movie.title}
                      className="mood-card-poster-img"
                      loading="lazy"
                    />
                    <div className="mood-card-tags-overlay">
                      {getMovieTags(movie.title, movie.genre, selectedMood?.label).slice(0, 1).map((tag) => (
                        <span key={tag} className="mood-card-tag-badge">{tag}</span>
                      ))}
                    </div>
                    <div className="mood-card-year">{movie.year}</div>
                  </div>
                  <div className="mood-card-body">
                    <h4 className="mood-card-title" title={movie.title}>{movie.title}</h4>
                    <span className="mood-card-genre">{movie.genre}</span>
                    <p className="mood-card-desc">{movie.description}</p>
                    <p className="mood-card-reason">{movie.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedMood && !loading && recommendations.length === 0 && !error && (
        <div className="mood-empty">
          <p>No recommendations found for this mood. Try another!</p>
        </div>
      )}

      {/* Spotlight modal overlay */}
      <AnimatePresence>
        {surpriseMovie && (
          <motion.div
            className="mood-spotlight-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSurpriseMovie(null)}
          >
            <motion.div
              className="mood-spotlight-card"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="mood-spotlight-close"
                onClick={() => setSurpriseMovie(null)}
                aria-label="Close Spotlight"
              >
                ✕
              </button>
              <div className="mood-spotlight-body">
                <div className="mood-spotlight-poster-wrap">
                  <img
                    src={getMoviePoster(surpriseMovie.title, surpriseMovie.genre)}
                    alt={surpriseMovie.title}
                  />
                  <div className="mood-spotlight-glow" />
                </div>
                <div className="mood-spotlight-info">
                  <span className="mood-spotlight-badge">🎲 Surprise Spotlight</span>
                  <h2>{surpriseMovie.title} ({surpriseMovie.year})</h2>
                  <div className="mood-spotlight-genre-wrap">
                    <span className="mood-spotlight-genre">{surpriseMovie.genre}</span>
                    {getMovieTags(surpriseMovie.title, surpriseMovie.genre, selectedMood?.label).map((t) => (
                      <span key={t} className="mood-spotlight-tag">{t}</span>
                    ))}
                  </div>
                  <p className="mood-spotlight-desc">{surpriseMovie.description}</p>
                  <div className="mood-spotlight-reason-box">
                    <strong>Why it fits:</strong>
                    <p>{surpriseMovie.reason}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
