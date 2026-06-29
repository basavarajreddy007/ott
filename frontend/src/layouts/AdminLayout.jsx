import { Outlet, Link, useLocation } from "react-router-dom";
import { HiChartBar, HiFilm, HiUsers, HiCollection, HiCurrencyDollar, HiViewGrid, HiArrowLeft, HiBriefcase } from "react-icons/hi";
import "../css/AdminLayout.css";

const sidebarLinks = [
  { path: "/admin", icon: HiViewGrid, label: "Dashboard" },
  { path: "/admin/upload-movie", icon: HiFilm, label: "Upload Movie" },
  { path: "/admin/users", icon: HiUsers, label: "Users" },
  { path: "/admin/reviews", icon: HiCollection, label: "Reviews" },
  { path: "/admin/subscriptions", icon: HiCurrencyDollar, label: "Subscriptions" },
  { path: "/admin/analytics", icon: HiChartBar, label: "Analytics" },
  { path: "/admin/brands", icon: HiBriefcase, label: "Brands" },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-back-link"><HiArrowLeft /> Back to Site</Link>
          <h2 className="admin-logo">MOVIEMAX</h2>
          <p className="admin-subtitle">Admin Panel</p>
        </div>
        <nav className="admin-nav">
          {sidebarLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`admin-nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <link.icon />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
