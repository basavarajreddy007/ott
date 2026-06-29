import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    adminAPI.getUsers({ page, limit: 20, search }).then(({ data }) => {
      setUsers(data.data);
      setPagination(data.pagination);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch { toast.error("Failed"); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success("User deleted");
      fetchUsers();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Manage Users</h1>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input type="text" className="form-input" style={{ maxWidth: 300 }} placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>

      {loading ? (
        <div className="admin-loading"><div className="spinner" style={{ width: 40, height: 40 }} /></div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                  <td>{u.isVerified ? "Yes" : "No"}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => toggleRole(u._id, u.role)}>
                        Make {u.role === "admin" ? "User" : "Admin"}
                      </button>
                      <button className="btn btn-sm btn-outline" style={{ borderColor: "#E50914", color: "#E50914" }} onClick={() => deleteUser(u._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary">Previous</button>
              <span className="pagination-info">{page} of {pagination.pages}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
