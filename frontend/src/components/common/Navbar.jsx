import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { HiMenu, HiX, HiSearch, HiBell, HiUser } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { notificationAPI } from "../../services/api";
import {
  navbarVariants,
  mobileMenuContainerVariants,
  mobileMenuItemVariants,
  navActionIconVariants
} from "../../animations";
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifCount(0);
      return;
    }
    notificationAPI.getUnreadCount()
      .then(({ data }) => setNotifCount(data.data.count))
      .catch(() => setNotifCount(0));
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

  const renderNavLinks = () => (
    <>
      <NavLink to="/" className="nav-link" onClick={closeMenu} end>
        {({ isActive }) => (
          <>
            <span>Home</span>
            {isActive && (
              <motion.span
                layoutId="nav-underline"
                className="nav-link-underline-fm"
                style={{
                  position: "absolute",
                  bottom: "2px",
                  left: "12px",
                  right: "12px",
                  height: "2px",
                  background: "var(--color-accent-primary)",
                  borderRadius: "999px"
                }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
              />
            )}
          </>
        )}
      </NavLink>
      <NavLink to="/movies" className="nav-link" onClick={closeMenu}>
        {({ isActive }) => (
          <>
            <span>Movies</span>
            {isActive && (
              <motion.span
                layoutId="nav-underline"
                className="nav-link-underline-fm"
                style={{
                  position: "absolute",
                  bottom: "2px",
                  left: "12px",
                  right: "12px",
                  height: "2px",
                  background: "var(--color-accent-primary)",
                  borderRadius: "999px"
                }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
              />
            )}
          </>
        )}
      </NavLink>
      <NavLink to="/tv-shows" className="nav-link" onClick={closeMenu}>
        {({ isActive }) => (
          <>
            <span>TV Shows</span>
            {isActive && (
              <motion.span
                layoutId="nav-underline"
                className="nav-link-underline-fm"
                style={{
                  position: "absolute",
                  bottom: "2px",
                  left: "12px",
                  right: "12px",
                  height: "2px",
                  background: "var(--color-accent-primary)",
                  borderRadius: "999px"
                }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
              />
            )}
          </>
        )}
      </NavLink>
      <div className="navbar-links-extras">
        {user && (
          <NavLink to="/upload-movie" className="nav-link" onClick={closeMenu}>
            {({ isActive }) => (
              <>
                <span>Upload</span>
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="nav-link-underline-fm"
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      left: "12px",
                      right: "12px",
                      height: "2px",
                      background: "var(--color-accent-primary)",
                      borderRadius: "999px"
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                  />
                )}
              </>
            )}
          </NavLink>
        )}
        <Link to="/ai/script" className="nav-link nav-link-ai" onClick={closeMenu}>AI Studio</Link>
      </div>
    </>
  );

  return (
    <motion.nav
      className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">MOVIEMAX</Link>
        </div>

        {!isMobile && (
          <div className="navbar-links">
            {renderNavLinks()}
          </div>
        )}

        <AnimatePresence>
          {isMobile && menuOpen && (
            <>
              <motion.div
                className="navbar-overlay"
                onClick={closeMenu}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ zIndex: 998 }}
              />
              <motion.div
                className="navbar-links open"
                variants={mobileMenuContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ zIndex: 999 }}
              >
                <motion.div variants={mobileMenuItemVariants}>
                  <NavLink to="/" className="nav-link" onClick={closeMenu} end>Home</NavLink>
                </motion.div>
                <motion.div variants={mobileMenuItemVariants}>
                  <NavLink to="/movies" className="nav-link" onClick={closeMenu}>Movies</NavLink>
                </motion.div>
                <motion.div variants={mobileMenuItemVariants}>
                  <NavLink to="/tv-shows" className="nav-link" onClick={closeMenu}>TV Shows</NavLink>
                </motion.div>
                <motion.div className="navbar-links-extras" variants={mobileMenuItemVariants}>
                  {user && (
                    <NavLink to="/upload-movie" className="nav-link" onClick={closeMenu}>Upload</NavLink>
                  )}
                  <Link to="/ai/script" className="nav-link nav-link-ai" onClick={closeMenu}>AI Studio</Link>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="navbar-right">
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
                <motion.div
                  variants={navActionIconVariants}
                  whileHover="hover"
                  whileTap="tap"
                  style={{ display: "inline-block" }}
                >
                  <Link to="/notifications" className="nav-icon-btn" aria-label="Notifications">
                    <HiBell />
                    {notifCount > 0 && (
                      <span className="notif-badge" aria-live="polite">
                        {notifCount > 9 ? "9+" : notifCount}
                      </span>
                    )}
                  </Link>
                </motion.div>
                <div
                  className="user-menu"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  <motion.button
                    className="nav-icon-btn nav-avatar-btn"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-label="User menu"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    variants={navActionIconVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="nav-avatar" />
                    ) : (
                      <HiUser />
                    )}
                  </motion.button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        className="user-dropdown open"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} style={{ display: "inline-block" }}>
                  <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} style={{ display: "inline-block" }}>
                  <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                </motion.div>
              </div>
            )}

            <button
              className="menu-toggle"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <HiMenu className="menu-icon-closed" style={{ transform: menuOpen ? "rotate(-90deg)" : "rotate(0deg)", opacity: menuOpen ? 0 : 1 }} />
              <HiX className="menu-icon-open" style={{ transform: menuOpen ? "rotate(0deg)" : "rotate(90deg)", opacity: menuOpen ? 1 : 0 }} />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
