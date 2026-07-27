import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { movieAPI, historyAPI } from "../services/api";
import { aiAPI } from "../services/ai";
import { useAuth } from "../hooks/useAuth";
import HeroBanner from "../components/home/HeroBanner";
import ContentRow from "../components/home/ContentRow";
import MoodSection from "../components/home/MoodSection";

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [aiRecs, setAiRecs] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, trendingRes, newReleasesRes, uploadsRes] = await Promise.all([
          movieAPI.getFeatured(),
          movieAPI.getTrending(),
          movieAPI.getNewReleases(),
          movieAPI.getUserUploads().catch(() => ({ data: { data: [] } })),
        ]);
        const featuredItems = featuredRes?.data?.data || [];
        const uploads = uploadsRes?.data?.data || [];
        const heroItems = [...featuredItems];
        const existingIds = new Set(featuredItems.map(m => m._id));
        for (const u of uploads) {
          if (!existingIds.has(u._id) && u.poster?.url) {
            heroItems.push({ ...u, type: "Movie" });
            existingIds.add(u._id);
          }
        }
        setFeatured(heroItems);
        setTrending(trendingRes.data.data);
        setNewReleases(newReleasesRes.data.data);
      } catch (err) {
        console.error(err);
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
        setAiRecs(data.data.content);
      }).catch(() => {});
    }
    historyAPI.getContinueWatching().then(({ data }) => {
      setContinueWatching(data.data || []);
    }).catch(() => {});
  }, [user]);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: "85vh", borderRadius: 0 }} />
        <div style={{ padding: "48px 4%" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 48 }}>
              <div className="skeleton" style={{ width: 180, height: 20, marginBottom: 20, borderRadius: "4px" }} />
              <div style={{ display: "flex", gap: 20, overflow: "hidden" }}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="skeleton" style={{ minWidth: 200, aspectRatio: "2/3", borderRadius: "12px" }} />
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
      <MoodSection />
      {continueWatching.length > 0 && (
        <ContentRow
          title="Continue Watching"
          link="/continue-watching"
          items={continueWatching.map((item) => ({ ...item.content, progress: item.progress, type: item.contentType }))}
        />
      )}
      <ContentRow title="Trending Now" link="/movies?sort=trending" items={trending} type="Movie" />
      <ContentRow title="New Releases" link="/movies?sort=new" items={newReleases} type="Movie" />

      {aiRecs && (
        <section className="section ai-recs" style={{ padding: "0 4%" }}>
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
  );
}
