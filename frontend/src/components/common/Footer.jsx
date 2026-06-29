import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaArrowUp } from "react-icons/fa";
import "../../css/Footer.css";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-section">
            <Link to="/" className="footer-logo">MOVIEMAX</Link>
            <p className="footer-desc">
              Your premium destination for unlimited movies, TV shows, and web series. Experience entertainment like never before.
            </p>
            <div className="social-links">
              <a href="#" className="social-link"><FaFacebook /></a>
              <a href="#" className="social-link"><FaTwitter /></a>
              <a href="#" className="social-link"><FaInstagram /></a>
              <a href="#" className="social-link"><FaYoutube /></a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Browse</h4>
            <Link to="/movies" className="footer-link">Movies</Link>
            <Link to="/tv-shows" className="footer-link">TV Shows</Link>
            <Link to="/categories" className="footer-link">Categories</Link>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Genres</h4>
            <Link to="/genre/Action" className="footer-link">Action</Link>
            <Link to="/genre/Comedy" className="footer-link">Comedy</Link>
            <Link to="/genre/Horror" className="footer-link">Horror</Link>
            <Link to="/genre/Sci-Fi" className="footer-link">Sci-Fi</Link>
            <Link to="/genre/Romance" className="footer-link">Romance</Link>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Support</h4>
            <Link to="/about" className="footer-link">About Us</Link>
            <Link to="/contact" className="footer-link">Contact</Link>
            <Link to="/faq" className="footer-link">FAQ</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
          </div>

          <div className="footer-section newsletter">
            <h4 className="footer-heading">Newsletter</h4>
            <p className="footer-desc">Subscribe to get updates on new releases and exclusive offers.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email" className="newsletter-input" />
              <button type="submit" className="btn btn-primary btn-sm">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">&copy; 2026 MOVIEMAX. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/faq">Cookies</Link>
          </div>
        </div>
      </div>

      <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
        <FaArrowUp />
      </button>
    </footer>
  );
}
