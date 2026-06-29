import { useState, useEffect } from "react";
import { historyAPI } from "../services/api";
import MovieCard from "../components/common/MovieCard";

export default function ContinueWatchingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyAPI.getContinueWatching().then(({ data }) => setItems(data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="browse-page">
      <h1 className="browse-title" style={{ marginBottom: 32 }}>Continue Watching</h1>
      {loading ? (
        <div className="browse-grid">
          {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 12 }} />))}
        </div>
      ) : items.length === 0 ? (
        <div className="browse-empty"><h3>Nothing to continue</h3><p>Start watching something new!</p></div>
      ) : (
        <div className="browse-grid">{items.map((item) => (<MovieCard key={item._id} item={item} type={item.contentType} />))}</div>
      )}
    </div>
  );
}
