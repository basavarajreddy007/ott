import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { HiMenu, HiX, HiSearch, HiBell, HiUser, HiUpload } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { notificationAPI } from "../../services/api";
import "../../css/Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifCount, setNotifCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      notificationAPI.getUnreadCount()
        .then(({ data }) => setNotifCount(data.data.count))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    if (menuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/");
  };

  const openDropdown = () => {
    clearTimeout(dropdownTimeoutRef.current);
    setDropdownOpen(true);
  };

  const closeDropdown = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">MOVIEMAX</Link>
        </div>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" className="nav-link" onClick={closeMenu} end>Home</NavLink>
          <NavLink to="/movies" className="nav-link" onClick={closeMenu}>Movies</NavLink>
          <NavLink to="/tv-shows" className="nav-link" onClick={closeMenu}>TV Shows</NavLink>
          <Link to="/upload" className="nav-link nav-link-upload" onClick={closeMenu}>
            <HiUpload /> Upload
          </Link>
        </div>

        <div className="navbar-right">
          <Link to="/ai/script" className="nav-link nav-link-ai" onClick={closeMenu}>AI Studio</Link>
          <div className="navbar-actions">
            <form onSubmit={handleSearch} className="search-form" role="search">
              <HiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Search movies and shows"
              />
            </form>

            {user ? (
              <>
                <Link to="/notifications" className="nav-icon-btn" aria-label="Notifications">
                  <HiBell />
                  {notifCount > 0 && (
                    <span className="notif-badge" aria-live="polite">
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </Link>
                <div
                  className="user-menu"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  <button
                    className="nav-icon-btn nav-avatar-btn"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-label="User menu"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="nav-avatar" />
                    ) : (
                      <HiUser />
                    )}
                  </button>
                  <div
                    className={`user-dropdown ${dropdownOpen ? "open" : ""}`}
                    onMouseEnter={openDropdown}
                    onMouseLeave={closeDropdown}
                    role="menu"
                  >
                    <Link to="/profile" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>Profile</Link>
                    <Link to="/favorites" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>Favorites</Link>
                    <Link to="/subscription" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>Subscription</Link>
                    <Link to="/settings" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>Settings</Link>
                    {user.role === "admin" && (
                      <Link to="/admin" className="dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>Admin Panel</Link>
                    )}
                    <hr className="dropdown-divider" />
                    <button onClick={handleLogout} className="dropdown-item" role="menuitem">Sign Out</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </div>
            )}

            <button
              className="menu-toggle"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <HiMenu className="menu-icon-closed" />
              <HiX className="menu-icon-open" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
