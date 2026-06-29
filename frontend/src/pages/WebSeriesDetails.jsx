import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { HiPlay } from "react-icons/hi";
import { webSeriesAPI } from "../services/api";

export default function WebSeriesDetails() {
  const { slug } = useParams();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(0);

  useEffect(() => {
    webSeriesAPI.getBySlug(slug).then(({ data }) => { setSeries(data.data); }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="details-loading"><div className="skeleton" style={{ height: "70vh" }} /></div>;
  if (!series) return <div className="browse-empty"><h3>Web Series not found</h3></div>;

  const seasons = series.seasons || [];

  return (
    <div className="details-page">
      <div className="details-banner">
        <img src={series.banner?.url || series.poster?.url} alt="" className="details-banner-img" />
        <div className="details-banner-gradient" />
      </div>

      <div className="details-content">
        <div className="details-poster"><img src={series.poster?.url} alt={series.title} /></div>
        <div className="details-info">
          <h1 className="details-title">{series.title}</h1>
          <div className="details-meta">
            <span className="details-rating">&#9733; {series.imdbRating}</span>
            <span>{series.releaseYear}</span>
            <span className="quality-badge">{series.quality}</span>
            <span>{series.language}</span>
            <span>{series.totalSeasons} Season{series.totalSeasons > 1 ? "s" : ""}</span>
          </div>
          <div className="details-genres">
            {series.genres?.map((g) => (<span key={g._id} className="genre-chip">{g.name}</span>))}
          </div>
          <p className="details-desc">{series.description}</p>

          {seasons.length > 0 && (
            <div className="seasons-section">
              <h3>Seasons</h3>
              <div className="season-tabs">
                {seasons.map((s, i) => (
                  <button key={i} className={`season-tab ${activeSeason === i ? "active" : ""}`} onClick={() => setActiveSeason(i)}>
                    Season {s.seasonNumber}
                  </button>
                ))}
              </div>

              <div className="episodes-list">
                {seasons[activeSeason]?.episodes?.map((ep) => (
                  <Link key={ep._id} to={`/watch/WebSeries/${series.slug}?season=${ep.seasonNumber}&episode=${ep.episodeNumber}`} className="episode-card">
                    <div className="episode-thumb">
                      {ep.thumbnail?.url ? <img src={ep.thumbnail.url} alt="" /> : <div className="episode-placeholder"><HiPlay /></div>}
                    </div>
                    <div className="episode-info">
                      <span className="episode-number">S{ep.seasonNumber}:E{ep.episodeNumber}</span>
                      <h4 className="episode-title">{ep.title}</h4>
                      <p className="episode-desc">{ep.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
