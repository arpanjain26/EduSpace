import { useEffect, useState } from "react";

// Star positions are calculated once, from the star's number, so they never jump around.
const STARS = Array.from({ length: 120 }, (_, i) => ({
  x: (i * 73.13) % 100,
  y: (i * 41.71) % 100,
  size: 0.5 + (i % 4) * 0.7,
  delay: (i % 11) * 0.5,
  opacity: 0.15 + (i % 5) * 0.15,
}));

function ShootingStar({ id }: { id: number }) {
  const top = 5 + (id * 37) % 60;
  const left = (id * 53) % 70;
  return (
    <span
      className="absolute h-px animate-shooting-star rounded-full"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: "80px",
        background: "linear-gradient(90deg, rgba(0,212,255,0.8), transparent)",
        animationDelay: `${id * 4}s`,
        animationIterationCount: "infinite",
      }}
    />
  );
}

export function CosmicBackground() {
  // Only render shooting stars client-side (they re-trigger periodically)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Nebula / galaxy gradient overlays */}
      <div className="absolute -left-32 -top-40 h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(108,92,231,0.15) 0%, transparent 70%)" }} />
      <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-1/4 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,107,203,0.06) 0%, transparent 70%)" }} />

      {/* Twinkling stars */}
      {STARS.map((s, i) => (
        <span key={i} className="absolute animate-twinkle rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: i % 7 === 0 ? "rgba(0,212,255,0.6)" : i % 11 === 0 ? "rgba(255,107,203,0.5)" : "rgba(234,234,245,0.5)",
            animationDelay: `${s.delay}s`,
            opacity: s.opacity,
            boxShadow: s.size > 1.5 ? `0 0 ${s.size * 2}px rgba(234,234,245,0.3)` : "none",
          }} />
      ))}

      {/* Occasional shooting stars */}
      {mounted && [0, 1, 2].map((id) => <ShootingStar key={id} id={id} />)}
    </div>
  );
}
