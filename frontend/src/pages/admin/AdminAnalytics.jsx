import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then(({ data }) => setData(data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner" style={{ width: 50, height: 50 }} /></div>;
  if (!data) return <div className="browse-empty"><h3>No analytics data</h3></div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Analytics</h1>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{data.totalViews || 0}</span>
            <span className="stat-label">Total Movie Views</span>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h3>Top Rated Movies</h3>
          <div className="admin-list">
            {data.topRatedMovies?.length > 0 ? (
              data.topRatedMovies.map((m) => (
                <div key={m._id} className="admin-list-item">
                  <span>{m.title}</span>
                  <span style={{ color: "#FFD54F" }}>&#9733; {m.averageRating?.toFixed(1) || "N/A"}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#888", padding: "12px" }}>No data available</p>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h3>Most Viewed</h3>
          <div className="admin-list">
            {data.mostViewed?.length > 0 ? (
              data.mostViewed.map((m) => (
                <div key={m._id} className="admin-list-item">
                  <span>{m.title}</span>
                  <span style={{ color: "#B3B3B3" }}>{m.views} views</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#888", padding: "12px" }}>No data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h3>Users by Month</h3>
          <div className="admin-list">
            {data.monthlyUsers?.length > 0 ? (
              data.monthlyUsers.map((m) => (
                <div key={m._id} className="admin-list-item">
                  <span>Month {m._id ?? "N/A"}</span>
                  <span>{m.count} users</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#888", padding: "12px" }}>No data available</p>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h3>Revenue by Month</h3>
          <div className="admin-list">
            {data.revenueByMonth?.length > 0 ? (
              data.revenueByMonth.map((r) => (
                <div key={r._id} className="admin-list-item">
                  <span>Month {r._id ?? "N/A"}</span>
                  <span style={{ color: "#4CAF50" }}>${r.total} ({r.count} txns)</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#888", padding: "12px" }}>No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
