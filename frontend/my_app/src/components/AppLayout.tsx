import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  House,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import "../dashboard.css";

interface AppLayoutProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "My Plans", to: "/plans", icon: FolderKanban },
  { label: "Tasks", to: "/tasks", icon: CheckSquare },
  { label: "Calendar", to: "/calendar", icon: CalendarDays },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function AppLayout({
  searchTerm,
  onSearchChange,
}: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="top">
        <Link className="brand" to="/">
          <Sparkles className="brand-mark" size={28} strokeWidth={2.5} />
          AI Task Planner
        </Link>
        <label className="search-wrap">
          <Search className="search-icon" size={16} />
          <input
            className="search"
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search plans, tasks..."
            aria-label="Search plans and tasks"
          />
        </label>
        <Link className="home-return" to="/">
          <House size={16} /> Home
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Open navigation menu"
          aria-controls="app-sidebar"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={22} />
        </button>
      </header>

      {menuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="layout">
        <aside id="app-sidebar" className={`sidebar${menuOpen ? " open" : ""}`}>
          <div className="sidebar-mobile-head">
            <strong>Navigation</strong>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">
              <X size={20} />
            </button>
          </div>
          <nav className="nav" aria-label="Main navigation">
            {navigation.map(({ label, to, icon: Icon, ...properties }) => (
              <NavLink
                key={label}
                to={to}
                end={"end" in properties ? properties.end : false}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} strokeWidth={1.8} />
                {label}
              </NavLink>
            ))}
          </nav>

          <section className="promo">
            <Sparkles className="promo-mark" size={23} />
            <h3>Let AI plan your goals</h3>
            <p>Turn your ideas into actionable tasks and achieve more, faster.</p>
            <Link className="primary" to="/dashboard?create=1" onClick={() => setMenuOpen(false)}>
              <span aria-hidden="true">+</span> Create New Plan
            </Link>
          </section>
        </aside>

        <main className="app-main"><Outlet /></main>
      </div>

      <footer className="reference-footer">
        <strong>AI Smart Task Planner</strong>
        <span>Plan&nbsp; · &nbsp;Organize&nbsp; · &nbsp;Achieve</span>
      </footer>
    </>
  );
}