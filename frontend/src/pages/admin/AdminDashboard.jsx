import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { HiFilm, HiUsers, HiStar, HiCurrencyDollar } from "react-icons/hi";
import "../../css/Admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Movies", value: stats?.stats?.totalMovies || 0, icon: HiFilm, color: "#E50914" },
    { label: "Total Users", value: stats?.stats?.totalUsers || 0, icon: HiUsers, color: "#4CAF50" },
    { label: "Total Reviews", value: stats?.stats?.totalReviews || 0, icon: HiStar, color: "#FFD54F" },
    { label: "Revenue", value: `$${stats?.stats?.totalRevenue || 0}`, icon: HiCurrencyDollar, color: "#2196F3" },
  ];

  if (loading) return <div className="admin-loading"><div className="spinner" style={{ width: 50, height: 50 }} /></div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="admin-stats">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card" style={{ borderLeft: `3px solid ${card.color}` }}>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
            <card.icon style={{ fontSize: 28, color: card.color, opacity: 0.5 }} />
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h3>Recent Users</h3>
          <div className="admin-list">
            {stats?.recentUsers?.slice(0, 5).map((u) => (
              <div key={u._id} className="admin-list-item">
                <div>
                  <span>{u.name}</span>
                  <span style={{ color: "#666", fontSize: 13 }}>{u.email}</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin/users" className="btn btn-secondary" style={{ marginTop: 16 }}>View All Users</Link>
        </div>

        <div className="admin-card">
          <h3>Recent Payments</h3>
          <div className="admin-list">
            {stats?.recentPayments?.slice(0, 5).map((p) => (
              <div key={p._id} className="admin-list-item">
                <div>
                  <span>{p.user?.name || "Unknown"}</span>
                  <span style={{ color: "#4CAF50" }}>${p.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
