import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { movieAPI, historyAPI } from "../services/api";
import { aiAPI } from "../services/ai";
import { useAuth } from "../hooks/useAuth";
import HeroBanner from "../components/home/HeroBanner";
import ContentRow from "../components/home/ContentRow";
import MoodSection from "../components/home/MoodSection";
import MoviePreviewModal from "../components/common/MoviePreviewModal";
import { HiSparkles } from "react-icons/hi";

const mockFallbackMovies = [
  {
    _id: "m1",
    title: "Cyberpunk 2099: Neon Horizon",
    slug: "cyberpunk-2099",
    type: "Movie",
    releaseYear: 2026,
    imdbRating: 9.4,
    duration: 148,
    quality: "4K ULTRA HD",
    description: "In a futuristic megalopolis governed by sentient artificial intelligence, a rogue hacker uncovers a conspiracy that threatens human consciousness itself.",
    poster: { url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80" },
    banner: { url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80" },
    genres: [{ name: "Sci-Fi" }, { name: "Action" }]
  },
  {
    _id: "m2",
    title: "Interstellar Odyssey: Quantum Shift",
    slug: "interstellar-odyssey",
    type: "Movie",
    releaseYear: 2026,
    imdbRating: 9.2,
    duration: 164,
    quality: "DOLBY VISION",
    description: "A team of deep-space astronauts venture through a wormhole beyond known galaxy borders to discover humanity's next cosmic sanctuary.",
    poster: { url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80" },
    banner: { url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80" },
    genres: [{ name: "Sci-Fi" }, { name: "Adventure" }]
  },
  {
    _id: "m3",
    title: "The Obsidian Legacy",
    slug: "obsidian-legacy",
    type: "TvShow",
    releaseYear: 2025,
    imdbRating: 9.0,
    duration: 55,
    quality: "4K HDR",
    description: "Dynastic power plays, ancient shadow guilds, and political intrigue collide in this high-stakes dark fantasy epic.",
    poster: { url: "https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=600&q=80" },
    banner: { url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80" },
    genres: [{ name: "Fantasy" }, { name: "Drama" }]
  },
  {
    _id: "m4",
    title: "Shadow Protocol: Rogue Agent",
    slug: "shadow-protocol",
    type: "Movie",
    releaseYear: 2026,
    imdbRating: 8.9,
    duration: 132,
    quality: "4K ULTRA HD",
    description: "When an elite undercover operative is framed by corrupt agency leaders, he relies on instinct and high-tech weaponry to clear his name.",
    poster: { url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80" },
    banner: { url: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1920&q=80" },
    genres: [{ name: "Action" }, { name: "Thriller" }]
  },
  {
    _id: "m5",
    title: "Architects of Dreams",
    slug: "architects-of-dreams",
    type: "WebSeries",
    releaseYear: 2026,
    imdbRating: 9.1,
    duration: 48,
    quality: "DOLBY ATMOS",
    description: "A secret tech institute develops neural interfaces allowing humans to construct and share conscious dream worlds in real time.",
    poster: { url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80" },
    banner: { url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80" },
    genres: [{ name: "Sci-Fi" }, { name: "Mystery" }]
  }
];

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [aiRecs, setAiRecs] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Action", "Sci-Fi", "Drama", "4K Ultra HD", "Award Winners"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, trendingRes, uploadsRes] = await Promise.all([
          movieAPI.getFeatured().catch(() => ({ data: { data: [] } })),
          movieAPI.getTrending().catch(() => ({ data: { data: [] } })),
          movieAPI.getUserUploads().catch(() => ({ data: { data: [] } })),
        ]);

        let feat = featuredRes?.data?.data || [];
        let trend = trendingRes?.data?.data || [];
        const uploads = uploadsRes?.data?.data || [];

        if (!feat.length) feat = mockFallbackMovies;
        if (!trend.length) trend = mockFallbackMovies;

        const heroItems = [...feat];
        const existingIds = new Set(feat.map(m => m._id));
        for (const u of uploads) {
          if (!existingIds.has(u._id) && u.poster?.url) {
            heroItems.push({ ...u, type: "Movie" });
            existingIds.add(u._id);
          }
        }

        setFeatured(heroItems);
        setTrending(trend);
      } catch (err) {
        setFeatured(mockFallbackMovies);
        setTrending(mockFallbackMovies);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) {
      setContinueWatching([]);
      setAiRecs(null);
      return;
    }
    const genres = user?.preferences?.genres || [];
    if (genres.length > 0) {
      aiAPI.recommend({ genres }).then(({ data }) => {
        setAiRecs(data?.data?.content);
      }).catch(() => {});
    }
    historyAPI.getContinueWatching().then(({ data }) => {
      setContinueWatching(data?.data || []);
    }).catch(() => {});
  }, [user]);

  const handleQuickView = (item) => {
    setQuickViewItem(item);
  };

  const filterByCat = (list) => {
    if (activeCategory === "All") return list;
    if (activeCategory === "4K Ultra HD") return list.filter(i => (i.quality || "").includes("4K"));
    return list.filter(i => (i.genres || []).some(g => (g.name || g).toLowerCase().includes(activeCategory.toLowerCase())));
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: "90vh", borderRadius: 0 }} />
        <div className="container" style={{ padding: "48px 20px" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 48 }}>
              <div className="skeleton" style={{ width: 220, height: 26, marginBottom: 20, borderRadius: "10px" }} />
              <div style={{ display: "flex", gap: 20, overflow: "hidden" }}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="skeleton" style={{ minWidth: 220, aspectRatio: "2/3", borderRadius: "22px" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="home-page" style={{ position: "relative" }}>
      <HeroBanner items={featured} onQuickView={handleQuickView} />

      <div className="container" style={{ marginTop: "-30px", marginBottom: "40px", position: "relative", zIndex: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            overflowX: "auto",
            padding: "12px 20px",
            background: "rgba(16, 18, 23, 0.8)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "999px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)"
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 700,
                color: activeCategory === cat ? "#ffffff" : "#A8B0C0",
                background: activeCategory === cat ? "var(--color-accent-primary)" : "transparent",
                border: activeCategory === cat ? "1px solid var(--color-accent-primary)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.25s ease",
                whiteSpace: "nowrap",
                boxShadow: activeCategory === cat ? "var(--shadow-glow-accent)" : "none"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <MoodSection />

      {continueWatching.length > 0 && (
        <ContentRow
          title="Continue Watching"
          link="/continue-watching"
          items={continueWatching.map((item) => ({ ...item.content, progress: item.progress, type: item.contentType }))}
          onQuickView={handleQuickView}
        />
      )}

      <ContentRow
        title="Top 10 Blockbusters"
        link="/movies?sort=trending"
        items={filterByCat(trending)}
        type="Movie"
        onQuickView={handleQuickView}
      />

      {aiRecs && (
        <section className="section ai-recs container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-tag" />
              <HiSparkles style={{ color: "#00D4FF" }} /> AI Personal Cinema Curator
            </h2>
            <Link to="/ai/script" className="section-link">AI Studio &rarr;</Link>
          </div>
          <div className="ai-recs-content">
            {aiRecs.split("\n").filter(l => l.trim()).slice(0, 6).map((line, i) => (
              <p key={i} className="ai-recs-line">{line}</p>
            ))}
          </div>
        </section>
      )}

      {quickViewItem && (
        <MoviePreviewModal item={quickViewItem} onClose={() => setQuickViewItem(null)} />
      )}
    </div>
  );
}
