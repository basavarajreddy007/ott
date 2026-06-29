import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { movieAPI, tvShowAPI, webSeriesAPI } from "../services/api";
import MovieCard from "../components/common/MovieCard";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState({ movies: [], tvShows: [], webSeries: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    const search = async () => {
      setLoading(true);
      try {
        const [movies, tvShows, webSeries] = await Promise.all([
          movieAPI.getAll({ search: query, limit: 10 }),
          tvShowAPI.getAll({ search: query, limit: 10 }),
          webSeriesAPI.getAll({ search: query, limit: 10 }),
        ]);
        setResults({
          movies: movies.data.data,
          tvShows: tvShows.data.data,
          webSeries: webSeries.data.data,
        });
      } catch {
        setResults({ movies: [], tvShows: [], webSeries: [] });
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [query]);

  const hasResults = results.movies.length > 0 || results.tvShows.length > 0 || results.webSeries.length > 0;

  return (
    <div className="browse-page">
      <h1 className="browse-title" style={{ marginBottom: 32 }}>
        {query ? `Results for "${query}"` : "Search"}
      </h1>

      {loading ? (
        <div className="browse-grid">
          {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 12 }} />))}
        </div>
      ) : !hasResults ? (
        <div className="browse-empty">
          <h3>{query ? "No results found" : "Enter a search term to find content"}</h3>
        </div>
      ) : (
        <div>
          {results.movies.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title" style={{ marginBottom: 16 }}>Movies</h2>
              <div className="browse-grid">
                {results.movies.map((m) => (<MovieCard key={m._id} item={m} type="Movie" />))}
              </div>
            </section>
          )}
          {results.tvShows.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title" style={{ marginBottom: 16 }}>TV Shows</h2>
              <div className="browse-grid">
                {results.tvShows.map((s) => (<MovieCard key={s._id} item={s} type="TvShow" />))}
              </div>
            </section>
          )}
          {results.webSeries.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title" style={{ marginBottom: 16 }}>Web Series</h2>
              <div className="browse-grid">
                {results.webSeries.map((s) => (<MovieCard key={s._id} item={s} type="WebSeries" />))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
