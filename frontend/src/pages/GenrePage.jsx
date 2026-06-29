import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { movieAPI, genreAPI } from "../services/api";
import MovieCard from "../components/common/MovieCard";

export default function GenrePage() {
  const { genreId } = useParams();
  const [items, setItems] = useState([]);
  const [genre, setGenre] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      genreAPI.getById(genreId).then(({ data }) => setGenre(data.data)).catch(() => {}),
      movieAPI.getByGenre(genreId).then(({ data }) => setItems(data.data)).catch(() => setItems([])),
    ]).finally(() => setLoading(false));
  }, [genreId]);

  return (
    <div className="browse-page">
      <h1 className="browse-title" style={{ marginBottom: 32 }}>{genre?.name || "Genre"}</h1>
      {loading ? (
        <div className="browse-grid">
          {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 12 }} />))}
        </div>
      ) : items.length === 0 ? (
        <div className="browse-empty"><h3>No content found in this genre</h3></div>
      ) : (
        <div className="browse-grid">
          {items.map((item) => (<MovieCard key={item._id} item={item} type="Movie" />))}
        </div>
      )}
    </div>
  );
}
