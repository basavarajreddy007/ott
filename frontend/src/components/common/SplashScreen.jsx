import { useState, useEffect } from "react";
import "../../css/SplashScreen.css";

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 600);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`splash-screen ${fadeOut ? "splash-fade-out" : ""}`}>
      <div className="splash-content">
        <div className="splash-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#E50914" />
            <polygon points="34,24 18,14 18,34" fill="white" />
          </svg>
        </div>
        <h1 className="splash-title">MOVIEMAX</h1>
        <div className="splash-loader">
          <div className="splash-loader-bar" />
        </div>
        <p className="splash-subtitle">Stream Unlimited Entertainment</p>
      </div>
    </div>
  );
}
