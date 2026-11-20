import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** A frosted-glass card around any content. */
export function GlassCard({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`glass ${className}`} style={style}>{children}</div>;
}

/** Small label + big title (+ optional description) at the top of a section. */
export function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-6 max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold gradient-text sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-astro-400">{description}</p>}
    </div>
  );
}

/** A big number with a label underneath. */
export function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <GlassCard className="px-5 py-4 transition-shadow hover:shadow-neon-purple">
      <p className="font-display text-3xl font-semibold tabular-nums gradient-text">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm text-astro-400">{label}</p>
    </GlassCard>
  );
}

const CHIP_TONES = {
  topic: "bg-nebula-500/20 text-nebula-400 hover:bg-nebula-500/30",
  entity: "bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25",
  method: "bg-gold-500/15 text-gold-400 hover:bg-gold-500/25",
  signal: "bg-pink-500/15 text-pink-400 hover:bg-pink-500/25",
} as const;

/** A small rounded tag. With `to`, it becomes a link inside EduSpace. */
export function Chip({ children, tone = "topic", to }: { children: ReactNode; tone?: keyof typeof CHIP_TONES; to?: string }) {
  const cls = `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${CHIP_TONES[tone]}`;
  return to ? <Link to={to} className={cls}>{children}</Link> : <span className={cls}>{children}</span>;
}

/** Shown when there is nothing to display. Never leave a blank space. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span aria-hidden className="mb-3 text-3xl">🔭</span>
      <p className="font-medium text-astro-100">{title}</p>
      {hint && <p className="mt-1 text-sm text-astro-400">{hint}</p>}
    </div>
  );
}

/** A tiny planet orbiting a dot, with honest text about what's happening. */
export function CosmicLoader({ label = "Mapping research…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-sm text-astro-400">
      <span className="relative inline-block h-6 w-6">
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-nebula-500" style={{ boxShadow: "0 0 6px rgba(108,92,231,0.6)" }} />
        <span className="absolute inset-0 animate-orbit-fast">
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-500" style={{ boxShadow: "0 0 6px rgba(0,212,255,0.5)" }} />
        </span>
      </span>
      {label}
    </div>
  );
}
