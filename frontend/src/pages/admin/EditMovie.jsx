import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { movieAPI, genreAPI, categoryAPI, uploadAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function EditMovie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [genres, setGenres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", releaseYear: new Date().getFullYear(),
    duration: 0, language: "English", imdbRating: 0, director: "",
    quality: "HD", isFeatured: false, isTrending: false, isNewRelease: false,
    genres: [], category: "",
    poster: "", posterPublicId: "", banner: "", bannerPublicId: "",
    video: "", videoPublicId: "", trailer: "", trailerPublicId: "",
  });

  useEffect(() => {
    Promise.all([
      movieAPI.getById(id).then(({ data }) => {
        const m = data.data;
        setForm({
          title: m.title, description: m.description, releaseYear: m.releaseYear,
          duration: m.duration, language: m.language, imdbRating: m.imdbRating,
          director: m.director || "", quality: m.quality, isFeatured: m.isFeatured,
          isTrending: m.isTrending, isNewRelease: m.isNewRelease,
          genres: m.genres?.map((g) => g._id || g) || [], category: m.category?._id || m.category || "",
          poster: m.poster?.url || "", posterPublicId: m.poster?.publicId || "",
          banner: m.banner?.url || "", bannerPublicId: m.banner?.publicId || "",
          video: m.video?.url || "", videoPublicId: m.video?.publicId || "",
          trailer: m.trailer?.url || "", trailerPublicId: m.trailer?.publicId || "",
        });
      }).catch(() => { navigate("/admin"); }),
      genreAPI.getAll({ all: true }).then(({ data }) => setGenres(data.data)),
      categoryAPI.getAll({ all: true }).then(({ data }) => setCategories(data.data)),
    ]).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const fieldMap = {
      poster: { url: "poster", publicId: "posterPublicId" },
      banner: { url: "banner", publicId: "bannerPublicId" },
      video: { url: "video", publicId: "videoPublicId" },
      trailer: { url: "trailer", publicId: "trailerPublicId" },
    };
    const fd = new FormData();
    fd.append("file", file);
    try {
      const uploadFn = field === "trailer" ? uploadAPI.video : (uploadAPI[field] || uploadAPI.image);
      const { data } = await uploadFn(fd);
      const map = fieldMap[field];
      setForm((prev) => ({ ...prev, [map.url]: data.data.url, [map.publicId]: data.data.publicId }));
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await movieAPI.update(id, form);
      toast.success("Movie updated");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner" style={{ width: 50, height: 50 }} /></div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Edit Movie</h1>
      <form onSubmit={handleSubmit}>
        <div className="admin-form">
          <div className="form-section">
            <h3>Basic Info</h3>
            <div className="form-row">
              <input name="title" className="form-input" placeholder="Title" value={form.title} onChange={handleChange} required style={{ flex: 2 }} />
              <input name="director" className="form-input" placeholder="Director" value={form.director} onChange={handleChange} style={{ flex: 1 }} />
            </div>
            <div className="form-row">
              <input name="releaseYear" type="number" className="form-input" placeholder="Year" value={form.releaseYear} onChange={handleChange} />
              <input name="duration" type="number" className="form-input" placeholder="Duration (min)" value={form.duration} onChange={handleChange} />
              <input name="imdbRating" type="number" step="0.1" className="form-input" placeholder="IMDb Rating" value={form.imdbRating} onChange={handleChange} />
            </div>
            <div className="form-row">
              <select name="language" className="filter-select" value={form.language} onChange={handleChange} style={{ width: "100%" }}>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Korean">Korean</option>
                <option value="Japanese">Japanese</option>
              </select>
              <select name="quality" className="filter-select" value={form.quality} onChange={handleChange} style={{ width: "100%" }}>
                <option value="SD">SD</option>
                <option value="HD">HD</option>
                <option value="Full HD">Full HD</option>
                <option value="4K">4K</option>
              </select>
              <select name="category" className="filter-select" value={form.category} onChange={handleChange} style={{ width: "100%" }}>
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <textarea name="description" className="form-input" placeholder="Description" value={form.description} onChange={handleChange} rows={4} style={{ marginTop: 12 }} />
          </div>

          <div className="form-section">
            <h3>Genres</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {genres.map((g) => (
                <label key={g._id} className="genre-chip" style={{ cursor: "pointer", padding: "6px 14px", borderRadius: 20, background: form.genres.includes(g._id) ? "#E50914" : "#333", color: "#fff", fontSize: 13 }}>
                  <input type="checkbox" checked={form.genres.includes(g._id)} onChange={() => setForm((prev) => ({ ...prev, genres: prev.genres.includes(g._id) ? prev.genres.filter((id) => id !== g._id) : [...prev.genres, g._id] }))} style={{ display: "none" }} />
                  {g.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Media Files</h3>
            <div className="form-row">
              <div className="upload-box">
                <label>Poster</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "poster")} />
                {form.poster && <img src={form.poster} alt="poster" style={{ width: 80, marginTop: 8 }} />}
              </div>
              <div className="upload-box">
                <label>Banner</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "banner")} />
                {form.banner && <img src={form.banner} alt="banner" style={{ width: 80, marginTop: 8 }} />}
              </div>
              <div className="upload-box">
                <label>Trailer</label>
                <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, "trailer")} />
              </div>
              <div className="upload-box">
                <label>Video</label>
                <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, "video")} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Flags</h3>
            <div style={{ display: "flex", gap: 24 }}>
              <label><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} /> Featured</label>
              <label><input type="checkbox" name="isTrending" checked={form.isTrending} onChange={handleChange} /> Trending</label>
              <label><input type="checkbox" name="isNewRelease" checked={form.isNewRelease} onChange={handleChange} /> New Release</label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 24 }}>
            {saving ? "Updating..." : "Update Movie"}
          </button>
        </div>
      </form>
    </div>
  );
}
