import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="browse-page" style={{ textAlign: "center", paddingTop: 120 }}>
      <h1 style={{ fontSize: 120, fontWeight: 900, color: "#E50914", lineHeight: 1 }}>404</h1>
      <h2 style={{ fontSize: 28, marginBottom: 16, color: "#FFFFFF" }}>Page Not Found</h2>
      <p style={{ color: "#666", marginBottom: 32 }}>The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
    </div>
  );
}
