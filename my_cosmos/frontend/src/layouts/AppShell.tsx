import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { CosmicBackground } from "../components/CosmicBackground";

const NAV = [
  { to: "/", label: "Explore", end: true },
  { to: "/papers", label: "Papers" },
  { to: "/search", label: "Search" },
  { to: "/map", label: "Research Map" },
  { to: "/trends", label: "Trends" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/assistant", label: "Assistant" },
];

export function AppShell() {
  const [open, setOpen] = useState(false); // is the mobile menu open?
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
      isActive ? "bg-nebula-500/20 font-semibold text-cyan-400" : "text-astro-400 hover:bg-white/5 hover:text-astro-100"
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <CosmicBackground />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to content</a>

      <header className="sticky top-0 z-40 border-b border-white/[0.08] backdrop-blur-lg" style={{ background: "rgba(11,13,26,0.8)" }}>
        <div className="container-eduspace flex h-16 items-center justify-between gap-4">
          <Link to="/" className="font-display text-lg font-bold tracking-[0.2em] gradient-text">EduSpace</Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>{n.label}</NavLink>)}
          </nav>
          <button type="button" className="rounded-full p-2 text-astro-400 xl:hidden" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="sr-only">Toggle navigation</span>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {open && (
          <nav aria-label="Primary mobile" className="container-eduspace flex flex-wrap gap-1 pb-3 xl:hidden">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={linkClass} onClick={() => setOpen(false)}>{n.label}</NavLink>)}
          </nav>
        )}
      </header>

      <main id="main" className="flex-1"><Outlet /></main>

      <footer className="mt-24 border-t border-white/[0.08] py-10 text-sm text-astro-400" style={{ background: "rgba(5,6,15,0.6)" }}>
        <div className="container-eduspace">
          <span className="font-display font-semibold tracking-[0.2em] gradient-text">EduSpace</span> · Explore humanity's knowledge beyond Earth.
        </div>
      </footer>
    </div>
  );
}
