import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { genreAPI } from "../services/api";

export default function Categories() {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    genreAPI.getAll().then(({ data }) => setGenres(data.data)).catch(() => {});
  }, []);

  return (
    <div className="browse-page">
      <h1 className="browse-title" style={{ marginBottom: 32 }}>Browse by Genre</h1>
      <div className="categories-grid">
        {genres.map((genre) => (
          <Link key={genre._id} to={`/genre/${genre._id}`} className="category-card">
            <h3 className="category-name">{genre.name}</h3>
            <p className="category-desc">{genre.description || "Explore content"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
