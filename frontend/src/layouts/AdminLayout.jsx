
import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import "./AdminLayout.css";

const menuItems = [
  { title: "Dashboard", path: "/admin/dashboard", icon: "▦" },
  { title: "Create Customer", path: "/admin/create-customer", icon: "＋" },
  { title: "Customer Management", path: "/admin/customers", icon: "♟" },
  { title: "Add Money", path: "/admin/deposit", icon: "▣" },
  { title: "Withdraw", path: "/admin/withdraw", icon: "↗" },
  { title: "Transactions", path: "/admin/transactions", icon: "⇄" },
  { title: "Login Requests", path: "/admin/login-requests", icon: "⇥" },
  { title: "Device Management", path: "/admin/devices", icon: "▣" },
  { title: "Security Reports", path: "/admin/security-reports", icon: "⬟" },
  { title: "Account Management", path: "/admin/accounts", icon: "⚙" },
  { title: "Support Requests", path: "/admin/support", icon: "☏" },
];

const bottomItems = [
  { title: "Reports", path: "/admin/reports", icon: "▥" },
  { title: "Settings", path: "/admin/settings", icon: "⚙" },
  { title: "Help", path: "/admin/help", icon: "?" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  let admin = {};

  try {
    admin = JSON.parse(localStorage.getItem("adminUser") || "{}");
  } catch {
    admin = {};
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login", { replace: true });
  }

  function renderLink(item) {
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={({ isActive }) =>
          `admin-nav-link ${isActive ? "active" : ""}`
        }
      >
        <span className="admin-nav-icon">{item.icon}</span>
        <span>{item.title}</span>
        <span className="admin-nav-arrow">›</span>
      </NavLink>
    );
  }

  return (
    <div className="admin-app">
      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">S</div>
          <div>
            <h2>SecureBank</h2>
            <span>ADMINISTRATION</span>
          </div>
        </div>

        <div className="admin-menu-label">MAIN MENU</div>

        <nav className="admin-navigation">
          {menuItems.map(renderLink)}
        </nav>

        <div className="admin-menu-label admin-bottom-label">
          PREFERENCES
        </div>

        <nav className="admin-navigation">
          {bottomItems.map(renderLink)}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-avatar">
            {(admin.fullName || admin.username || "A")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="admin-profile-info">
            <strong>{admin.fullName || admin.username || "Administrator"}</strong>
            <span>{admin.role || "ADMIN"}</span>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            <div className="admin-welcome">
              <h2>Welcome Back!</h2>
              <p>
                {admin.fullName || admin.username || "Admin"}{" "}
                <span className="admin-verified">✓</span>
              </p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-notification-wrapper">
              <button
                className="admin-notification-button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
              >
                ♧
                <span className="notification-count">3</span>
              </button>

              {notificationsOpen && (
                <div className="admin-notification-dropdown">
                  <h3>Notifications</h3>
                  <p>New admin dashboard session started.</p>
                  <p>Remember to review pending requests.</p>
                  <p>Check recent security reports.</p>
                </div>
              )}
            </div>

            <button
              className="admin-logout-icon"
              onClick={handleLogout}
              title="Logout"
            >
              ⇥
            </button>
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>

        <footer className="admin-footer">
          <span>© {new Date().getFullYear()} SecureBank</span>
          <span>Secure Administration Portal</span>
        </footer>
      </main>
    </div>
  );
}
