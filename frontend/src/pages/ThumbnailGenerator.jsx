import { useState, useRef } from "react";
import { aiAPI } from "../services/ai";
import toast from "react-hot-toast";
import "../css/ThumbnailGenerator.css";

const STYLE_OPTIONS = [
  { value: "", label: "Default" },
  { value: "Cinematic", label: "Cinematic" },
  { value: "Minimalist", label: "Minimalist" },
  { value: "Vintage", label: "Vintage" },
  { value: "Anime", label: "Anime" },
  { value: "Dark & Moody", label: "Dark & Moody" },
  { value: "Neon Noir", label: "Neon Noir" },
  { value: "Fantasy", label: "Fantasy" },
];

export default function ThumbnailGenerator() {
  const [form, setForm] = useState({ title: "", description: "", genre: "", style: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await aiAPI.generateThumbnail({
        title: form.title,
        description: form.description,
        genre: form.genre || undefined,
        style: form.style || undefined,
      });
      setResult(data.data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate thumbnail");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.url) return;
    try {
      const res = await fetch(result.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.title || "thumbnail"}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Thumbnail downloaded");
    } catch {
      window.open(result.url, "_blank");
    }
  };

  const handleCopyUrl = () => {
    if (!result?.url) return;
    navigator.clipboard.writeText(result.url);
    toast.success("URL copied to clipboard");
  };

  return (
    <div className="tg-page">
      <div className="tg-container">
        <div className="tg-header">
          <h1 className="tg-title">AI Thumbnail Generator</h1>
          <p className="tg-subtitle">Generate cinematic thumbnails for your content using AI</p>
        </div>

        <div className="tg-content">
          <div className="tg-form-section">
            <div className="tg-form-group">
              <label className="tg-label">Title *</label>
              <input
                className="tg-input"
                name="title"
                placeholder="e.g., Star Voyager"
                value={form.title}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="tg-form-group">
              <label className="tg-label">Description *</label>
              <textarea
                className="tg-textarea"
                name="description"
                placeholder="Describe what the content is about..."
                value={form.description}
                onChange={handleChange}
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="tg-form-row">
              <div className="tg-form-group">
                <label className="tg-label">Genre</label>
                <input
                  className="tg-input"
                  name="genre"
                  placeholder="e.g., Sci-Fi, Drama"
                  value={form.genre}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="tg-form-group">
                <label className="tg-label">Style</label>
                <select
                  className="tg-select"
                  name="style"
                  value={form.style}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="tg-generate-btn"
              onClick={handleGenerate}
              disabled={loading || !form.title.trim() || !form.description.trim()}
            >
              {loading ? (
                <>
                  <span className="tg-spinner" />
                  Generating...
                </>
              ) : (
                "Generate Thumbnail"
              )}
            </button>
          </div>

          <div className="tg-result-section" ref={resultRef}>
            {loading && (
              <div className="tg-loading">
                <div className="tg-loading-spinner" />
                <p>Creating your thumbnail... This may take a moment.</p>
              </div>
            )}

            {result && !loading && (
              <div className="tg-result">
                <div className="tg-image-wrapper">
                  <img src={result.url} alt="Generated thumbnail" className="tg-image" />
                </div>
                <div className="tg-actions">
                  <button className="tg-action-btn tg-download-btn" onClick={handleDownload}>
                    Download
                  </button>
                  <button className="tg-action-btn tg-copy-btn" onClick={handleCopyUrl}>
                    Copy URL
                  </button>
                </div>
                {result.prompt && (
                  <details className="tg-prompt-details">
                    <summary>View prompt used</summary>
                    <p className="tg-prompt-text">{result.prompt}</p>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}