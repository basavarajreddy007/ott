import { useState, useEffect } from "react";
import { subscriptionAPI, adminAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function ManageSubscriptions() {
  const [plans, setPlans] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      subscriptionAPI.getPlans().then(({ data }) => setPlans(data.data)).catch(() => {}),
      adminAPI.getRevenue().then(({ data }) => setRevenueData(data.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const deletePlan = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await subscriptionAPI.cancel();
      setPlans((prev) => prev.filter((p) => p._id !== id));
      toast.success("Plan deleted");
    } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="admin-loading"><div className="spinner" style={{ width: 50, height: 50 }} /></div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Subscription Management</h1>

      {revenueData && (
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-value">${revenueData.totalRevenue}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-value">${revenueData.monthlyRevenue}</span>
              <span className="stat-label">This Month</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-value">{revenueData.totalTransactions}</span>
              <span className="stat-label">Transactions</span>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: 16, color: "#FFFFFF" }}>Subscription Plans</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Quality</th>
            <th>Devices</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p._id}>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td>${p.price}</td>
              <td>{p.quality}</td>
              <td>{p.maxDevices}</td>
              <td>{p.duration} {p.durationUnit}</td>
              <td>
                <button className="btn btn-sm btn-outline" style={{ borderColor: "#E50914", color: "#E50914" }} onClick={() => deletePlan(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
