import { useState, useEffect } from "react";
import { brandAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function ManageBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", logo: { url: "" }, website: "", isActive: true });

  const fetchBrands = async () => {
    try {
      const { data } = await brandAPI.getAll({ all: true });
      setBrands(data.data);
    } catch {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", logo: { url: "" }, website: "", isActive: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (brand) => {
    setForm({ name: brand.name, description: brand.description || "", logo: brand.logo || { url: "" }, website: brand.website || "", isActive: brand.isActive });
    setEditing(brand._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    try {
      if (editing) {
        await brandAPI.update(editing, form);
        toast.success("Brand updated");
      } else {
        await brandAPI.create(form);
        toast.success("Brand created");
      }
      resetForm();
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save brand");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this brand?")) return;
    try {
      await brandAPI.delete(id);
      toast.success("Brand deleted");
      fetchBrands();
    } catch {
      toast.error("Failed to delete brand");
    }
  };

  if (loading) return <div className="spinner-fullscreen"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Brands</h2>
          <p style={{ color: "#B3B3B3", fontSize: 14 }}>Manage partner brands and logos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          Add Brand
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#1F1F1F", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{editing ? "Edit Brand" : "Add Brand"}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, color: "#B3B3B3", fontSize: 13 }}>Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, color: "#B3B3B3", fontSize: 13 }}>Website</label>
                <input className="form-input" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, color: "#B3B3B3", fontSize: 13 }}>Logo URL</label>
              <input className="form-input" value={form.logo.url} onChange={e => setForm({ ...form, logo: { url: e.target.value } })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, color: "#B3B3B3", fontSize: 13 }}>Description</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn btn-primary">{editing ? "Update" : "Create"}</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {brands.map(brand => (
          <div key={brand._id} style={{ background: "#1F1F1F", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
            {brand.logo?.url ? (
              <img src={brand.logo.url} alt={brand.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>{brand.name[0]}</div>
            )}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 15, fontWeight: 600 }}>{brand.name}</h4>
              {brand.description && <p style={{ color: "#B3B3B3", fontSize: 12, marginTop: 2 }}>{brand.description}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: brand.isActive ? "rgba(76,175,80,0.1)" : "rgba(255,193,7,0.1)", color: brand.isActive ? "#4CAF50" : "#FFC107" }}>
                  {brand.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(brand)}>Edit</button>
              <button className="btn btn-secondary btn-sm" style={{ color: "#E50914" }} onClick={() => handleDelete(brand._id)}>Delete</button>
            </div>
          </div>
        ))}
        {brands.length === 0 && !loading && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60, color: "#666" }}>
            <p>No brands yet. Click "Add Brand" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
