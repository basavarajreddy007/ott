import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { movieAPI, tvShowAPI, webSeriesAPI } from "../services/api";
import { aiAPI } from "../services/ai";
import { useAuth } from "../context/AuthContext";
import HeroBanner from "../components/home/HeroBanner";
import ContentRow from "../components/home/ContentRow";
import MoodSection from "../components/home/MoodSection";

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [webSeries, setWebSeries] = useState([]);
  const [userUploads, setUserUploads] = useState([]);
  const [aiRecs, setAiRecs] = useState(null);
  const [aiRecsLoading, setAiRecsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, trendingRes, topRatedRes, newReleasesRes, tvShowsRes, webSeriesRes, uploadsRes] = await Promise.all([
          movieAPI.getFeatured(),
          movieAPI.getTrending(),
          movieAPI.getTopRated(),
          movieAPI.getNewReleases(),
          tvShowAPI.getFeatured(),
          webSeriesAPI.getAll({ limit: 10 }),
          movieAPI.getUserUploads().catch(() => ({ data: { data: [] } })),
        ]);
        const featured = featuredRes.data.data;
        const uploads = uploadsRes.data.data;
        const heroItems = [...featured];
        const existingIds = new Set(featured.map(m => m._id));
        for (const u of uploads) {
          if (!existingIds.has(u._id) && u.poster?.url) {
            heroItems.push({ ...u, type: "Movie" });
            existingIds.add(u._id);
          }
        }
        setFeatured(heroItems);
        setTrending(trendingRes.data.data);
        setTopRated(topRatedRes.data.data);
        setNewReleases(newReleasesRes.data.data);
        setTvShows(tvShowsRes.data.data);
        setWebSeries(webSeriesRes.data.data);
        setUserUploads(uploads);
      } catch (err) {
        console.error("Failed to fetch home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) return;
    const genres = user?.preferences?.genres || [];
    if (genres.length === 0) return;
    setAiRecsLoading(true);
    aiAPI.recommend({ genres }).then(({ data }) => {
      setAiRecs(data.data.content);
    }).catch(() => {}).finally(() => setAiRecsLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: "90vh", borderRadius: 0 }} />
        <div style={{ padding: "40px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 40 }}>
              <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 16 }} />
              <div style={{ display: "flex", gap: 16 }}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="skeleton" style={{ minWidth: 200, aspectRatio: "2/3", borderRadius: 12 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <HeroBanner items={featured} />
      <div style={{ marginTop: "-80px", position: "relative", zIndex: 3 }}>
        <MoodSection />
        <ContentRow title="Trending Now" link="/movies?sort=trending" items={trending} type="Movie" />
        <ContentRow title="Top Rated" link="/movies?sort=rating" items={topRated} type="Movie" />
        <ContentRow title="New Releases" link="/movies?sort=new" items={newReleases} type="Movie" />

        {aiRecs && (
          <section className="section ai-recs">
            <div className="section-header">
              <h2 className="section-title">AI Picks For You</h2>
              <Link to="/ai/script" className="section-link">AI Studio &rarr;</Link>
            </div>
            <div className="ai-recs-content">
              {aiRecs.split("\n").filter(l => l.trim()).slice(0, 6).map((line, i) => (
                <p key={i} className="ai-recs-line">{line}</p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
