import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { HiPlay, HiInformationCircle } from "react-icons/hi";
import "../../css/HeroBanner.css";

export default function HeroBanner({ items = [] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % (items.length || 1));
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [items.length, next]);

  if (!items.length) {
    return (
      <div className="hero-banner">
        <div className="hero-placeholder">
          <h1>Welcome to MOVIEMAX</h1>
          <p>Unlimited movies, TV shows, and more.</p>
        </div>
      </div>
    );
  }

  const item = items[current];

  return (
    <div className="hero-banner">
      {items.map((feat, index) => (
        <div
          key={feat._id}
          className={`hero-slide ${index === current ? "active" : ""}`}
        >
          <div className="hero-backdrop">
            <img src={feat.banner?.url || feat.poster?.url} alt="" />
            <div className="hero-gradient" />
          </div>
        </div>
      ))}

      <div className="hero-content">
        <div className="hero-badge">{item.quality}</div>
        <h1 className="hero-title">{item.title}</h1>
        <div className="hero-meta">
          <span className="hero-year">{item.releaseYear}</span>
          {item.language && <span className="hero-language">{item.language}</span>}
        </div>
        <p className="hero-description">{item.description}</p>
        <div className="hero-actions">
          <Link to={`/watch/${item.type || "Movie"}/${item.slug}`} className="btn btn-primary btn-lg">
            <HiPlay /> Watch Now
          </Link>
          <Link to={`/${(item.type || "Movie").toLowerCase() === "movie" ? "movies" : (item.type || "Movie").toLowerCase() === "tvshow" ? "tv-shows" : "web-series"}/${item.slug}`} className="btn btn-secondary btn-lg">
            <HiInformationCircle /> More Info
          </Link>
        </div>
      </div>

      {items.length > 1 && (
        <div className="hero-dots">
          {items.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === current ? "active" : ""}`}
              onClick={() => setCurrent(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
