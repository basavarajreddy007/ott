import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { movieAPI, tvShowAPI, webSeriesAPI } from "../services/api";
import MovieCard from "../components/common/MovieCard";

const searchGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

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
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 12 }} />
          ))}
        </div>
      ) : !hasResults ? (
        <motion.div
          className="browse-empty"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h3>{query ? "No results found" : "Enter a search term to find content"}</h3>
          <p>{query ? "Please check the spelling or try searching for another term" : "Find movies, TV shows, and series instantly."}</p>
        </motion.div>
      ) : (
        <div>
          {results.movies.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title" style={{ marginBottom: 16 }}>Movies</h2>
              <motion.div
                className="browse-grid"
                variants={searchGridVariants}
                initial="hidden"
                animate="visible"
              >
                {results.movies.map((m) => (
                  <MovieCard key={m._id} item={m} type="Movie" />
                ))}
              </motion.div>
            </section>
          )}

          {results.tvShows.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title" style={{ marginBottom: 16 }}>TV Shows</h2>
              <motion.div
                className="browse-grid"
                variants={searchGridVariants}
                initial="hidden"
                animate="visible"
              >
                {results.tvShows.map((s) => (
                  <MovieCard key={s._id} item={s} type="TvShow" />
                ))}
              </motion.div>
            </section>
          )}

          {results.webSeries.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title" style={{ marginBottom: 16 }}>Web Series</h2>
              <motion.div
                className="browse-grid"
                variants={searchGridVariants}
                initial="hidden"
                animate="visible"
              >
                {results.webSeries.map((s) => (
                  <MovieCard key={s._id} item={s} type="WebSeries" />
                ))}
              </motion.div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
