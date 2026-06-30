import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadAPI, movieAPI, subscriptionAPI } from "../services/api";
import { aiAPI } from "../services/ai";
import toast from "react-hot-toast";
import "../css/Upload.css";

export default function Upload() {
  const navigate = useNavigate();
  const videoInputRef = useRef(null);
  const posterInputRef = useRef(null);

  const [form, setForm] = useState({ title: "", description: "", posterUrl: "", requiredPlan: "" });
  const [plans, setPlans] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [posterMode, setPosterMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [aiThumbLoading, setAiThumbLoading] = useState(false);
  const [videoResult, setVideoResult] = useState(null);
  const [posterResult, setPosterResult] = useState(null);

  useEffect(() => {
    subscriptionAPI.getPlans()
      .then(({ data }) => setPlans(data.data || []))
      .catch(() => {});
  }, []);

  const step = !videoResult ? 1 : !form.title.trim() ? 2 : 3;

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) setVideoFile(file);
  };

  const handlePosterSelect = (e) => {
    const file = e.target.files[0];
    if (file) setPosterFile(file);
  };

  const uploadVideo = async () => {
    if (!videoFile) return toast.error("Select a video file");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", videoFile);
      const { data } = await uploadAPI.video(fd);
      setVideoResult(data.data);
      toast.success("Video uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Video upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadPoster = async () => {
    if (!posterFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", posterFile);
      const { data } = await uploadAPI.poster(fd);
      setPosterResult(data.data);
      toast.success("Poster uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Poster upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAiDescribe = async () => {
    if (!form.title.trim()) return toast.error("Enter a title first");
    setAiDescLoading(true);
    try {
      const { data } = await aiAPI.describe({ title: form.title });
      setForm(p => ({ ...p, description: data.data.content }));
      toast.success("Description generated");
    } catch {
      toast.error("Failed to generate description");
    } finally {
      setAiDescLoading(false);
    }
  };

  const handleAiThumbnail = async () => {
    if (!form.title.trim()) return toast.error("Enter a title first");
    if (!form.description.trim()) return toast.error("Enter a description first");
    setAiThumbLoading(true);
    try {
      const { data } = await aiAPI.generateThumbnail({
        title: form.title,
        description: form.description,
      });
      setForm(p => ({ ...p, posterUrl: data.data.url }));
      toast.success("Thumbnail generated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate thumbnail");
    } finally {
      setAiThumbLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!videoResult) return toast.error("Upload a video first");
    if (!form.title.trim()) return toast.error("Enter a title");

    if (posterMode === "url" && !form.posterUrl.trim()) {
      return toast.error("Enter a poster URL or upload a file");
    }

    setSaving(true);
    try {
      const poster = posterMode === "url" || posterMode === "ai"
        ? { url: form.posterUrl, publicId: "" }
        : posterResult;

      const { data } = await movieAPI.createUserUpload({
        title: form.title,
        description: form.description,
        video: videoResult,
        poster: poster || null,
        requiredPlan: form.requiredPlan || null,
      });
      toast.success("Movie published!");
      navigate(`/movies/${data.data.slug}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { num: 1, label: "Upload Video" },
    { num: 2, label: "Details" },
    { num: 3, label: "Publish" },
  ];

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <div className="upload-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h1 className="upload-title">Upload Your Video</h1>
          <p className="upload-subtitle">Share your content with the MOVIEMAX community</p>
        </div>

        <div className="upload-steps">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`upload-step ${step >= s.num ? (step > s.num ? "completed" : "active") : ""}`}>
                <span className="upload-step-num">
                  {step > s.num ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : s.num}
                </span>
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`upload-step-line ${step > s.num ? "done" : ""}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="upload-form-layout">
          <div className="upload-form-main">
            <div className="upload-card">
              <div className="upload-card-header">
                <h3 className="upload-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Video Details
                </h3>
                {step > 1 && <span className="upload-card-badge done">Completed</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter a title for your video"
                  value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Describe your video..."
                  value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                />
                <button
                  type="button"
                  className="ai-desc-btn"
                  onClick={handleAiDescribe}
                  disabled={aiDescLoading || !form.title.trim()}
                  title="Generate with AI"
                >
                  {aiDescLoading ? <span className="upload-spinner" /> : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4 2-4 4-4z"/><path d="M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z"/><line x1="19" y1="7" x2="22" y2="7"/><line x1="20" y1="6" x2="20" y2="8"/></svg>
                  )}
                  <span>Generate with AI</span>
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Plan Tier</label>
                <select
                  className="form-input upload-plan-select"
                  value={form.requiredPlan}
                  onChange={(e) => setForm(p => ({ ...p, requiredPlan: e.target.value }))}
                >
                  <option value="">Free for all</option>
                  {plans.filter(p => p.price > 0).map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name} (${plan.price}/{plan.duration} {plan.durationUnit} - {plan.quality})
                    </option>
                  ))}
                </select>
                <span className="upload-plan-hint">
                  {form.requiredPlan
                    ? `Users need the selected plan to access this content`
                    : "Anyone can watch this content"}
                </span>
              </div>
            </div>

            <div className="upload-card">
              <div className="upload-card-header">
                <h3 className="upload-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  Video File
                </h3>
                {videoResult && <span className="upload-card-badge done">Uploaded</span>}
              </div>

              <div
                className="upload-dropzone"
                onClick={() => videoInputRef.current?.click()}
              >
                {videoFile ? (
                  <div className="upload-file-info">
                    <div className="upload-file-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    </div>
                    <span className="upload-file-name">{videoFile.name}</span>
                    <span className="upload-file-size">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="upload-dropzone-placeholder">
                    <div className="upload-drop-icon-wrap">
                      <svg className="upload-drop-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <span className="upload-drop-label">Click to select video file</span>
                    <span className="upload-drop-hint">MP4, WebM, MOV &middot; Max 500MB</span>
                  </div>
                )}
                <input ref={videoInputRef} type="file" accept="video/*" className="upload-file-input" onChange={handleVideoSelect} />
              </div>

              {videoFile && !videoResult && (
                <button className="btn btn-primary upload-btn" onClick={uploadVideo} disabled={uploading}>
                  {uploading ? <span className="upload-spinner" /> : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  )}
                  {uploading ? "Uploading..." : "Upload to Cloudinary"}
                </button>
              )}

              {videoResult && (
                <div className="upload-result success">
                  <span className="upload-result-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>Video uploaded successfully</span>
                </div>
              )}
            </div>
          </div>

          <div className="upload-form-side">
            <div className="upload-card">
              <div className="upload-card-header">
                <h3 className="upload-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Thumbnail / Poster
                </h3>
                {(posterResult || ((posterMode === "url" || posterMode === "ai") && form.posterUrl)) && <span className="upload-card-badge done">Done</span>}
              </div>

              <div className="upload-toggle-row">
                <button
                  className={`upload-toggle-btn ${posterMode === "upload" ? "active" : ""}`}
                  onClick={() => setPosterMode("upload")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload File
                </button>
                <button
                  className={`upload-toggle-btn ${posterMode === "url" ? "active" : ""}`}
                  onClick={() => setPosterMode("url")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Paste URL
                </button>
                <button
                  className={`upload-toggle-btn ${posterMode === "ai" ? "active" : ""}`}
                  onClick={() => setPosterMode("ai")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4 2-4 4-4z"/><path d="M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z"/><line x1="19" y1="7" x2="22" y2="7"/><line x1="20" y1="6" x2="20" y2="8"/></svg>
                  AI Generate
                </button>
              </div>

              {posterMode === "url" ? (
                <div className="form-group">
                  <label className="form-label">Poster Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/poster.jpg"
                    value={form.posterUrl}
                    onChange={(e) => setForm(p => ({ ...p, posterUrl: e.target.value }))}
                  />
                  {form.posterUrl && (
                    <div className="upload-poster-preview">
                      <img src={form.posterUrl} alt="preview" onError={(e) => { e.target.style.display = "none" }} />
                    </div>
                  )}
                </div>
              ) : posterMode === "ai" ? (
                <div className="form-group">
                  <label className="form-label">Generate with AI</label>
                  <p className="upload-plan-hint" style={{ marginBottom: 12 }}>
                    Uses your title &amp; description to generate a cinematic thumbnail
                  </p>
                  <button
                    type="button"
                    className="ai-desc-btn"
                    onClick={handleAiThumbnail}
                    disabled={aiThumbLoading || !form.title.trim() || !form.description.trim()}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {aiThumbLoading ? (
                      <span className="upload-spinner" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4 2-4 4-4z"/><path d="M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z"/><line x1="19" y1="7" x2="22" y2="7"/><line x1="20" y1="6" x2="20" y2="8"/></svg>
                    )}
                    <span>{aiThumbLoading ? "Generating..." : "Generate AI Thumbnail"}</span>
                  </button>
                  {form.posterUrl && posterMode === "ai" && (
                    <div className="upload-poster-preview" style={{ marginTop: 12 }}>
                      <img src={form.posterUrl} alt="generated thumbnail" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className="upload-dropzone"
                    onClick={() => posterInputRef.current?.click()}
                  >
                    {posterFile ? (
                      <div className="upload-file-info">
                        <div className="upload-file-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                        <span className="upload-file-name">{posterFile.name}</span>
                        <span className="upload-file-size">{(posterFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      <div className="upload-dropzone-placeholder">
                        <div className="upload-drop-icon-wrap">
                          <svg className="upload-drop-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                        <span className="upload-drop-label">Click to select poster image</span>
                        <span className="upload-drop-hint">JPG, PNG, WebP &middot; Ideal: 1080x1620</span>
                      </div>
                    )}
                    <input ref={posterInputRef} type="file" accept="image/*" className="upload-file-input" onChange={handlePosterSelect} />
                  </div>
                  {posterFile && !posterResult && (
                    <button className="btn upload-btn upload-btn-secondary" onClick={uploadPoster} disabled={uploading}>
                      {uploading ? <span className="upload-spinner" /> : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      )}
                      {uploading ? "Uploading..." : "Upload Poster"}
                    </button>
                  )}
                  {posterResult && (
                    <div className="upload-result success">
                      <span className="upload-result-check">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      <span>Poster uploaded</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="upload-publish-card">
              <h3 className="upload-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Publish
              </h3>
              <p className="upload-publish-hint">
                Your video will appear on the homepage hero banner after publishing.
                Make sure you've uploaded a video and entered a title.
              </p>

              {videoResult && form.title.trim() ? (
                <div className="upload-publish-status ready">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Ready to publish</span>
                </div>
              ) : (
                <div className="upload-publish-status error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{!videoResult ? "Upload a video first" : "Enter a title"}</span>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg upload-publish-btn"
                onClick={handlePublish}
                disabled={saving || !videoResult || !form.title.trim()}
              >
                {saving ? (
                  <><span className="upload-spinner" /> Publishing...</>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Publish to Home Page</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
