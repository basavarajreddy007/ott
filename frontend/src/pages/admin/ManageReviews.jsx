import { useState, useEffect } from "react";
import { reviewAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewAPI.getByContent("Movie", "all").then(({ data }) => setReviews(data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await reviewAPI.delete(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      toast.success("Review deleted");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Manage Reviews</h1>

      {loading ? (
        <div className="admin-loading"><div className="spinner" style={{ width: 40, height: 40 }} /></div>
      ) : reviews.length === 0 ? (
        <div className="browse-empty"><h3>No reviews found</h3></div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r._id}>
                <td>{r.user?.name || "Anonymous"}</td>
                <td style={{ color: "#FFD54F" }}>{r.rating}/10</td>
                <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.review}</td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-sm btn-outline" style={{ borderColor: "#E50914", color: "#E50914" }} onClick={() => deleteReview(r._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
