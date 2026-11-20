import { Link } from "react-router-dom";
import { api } from "../api";
import { AsyncView } from "../components/AsyncView";
import { PaperCard } from "../components/PaperCard";
import { SearchBar } from "../components/SearchBar";
import { Chip, GlassCard, SectionHeader, StatCard } from "../components/ui";
import { useAsync } from "../hooks/useAsync";

const EXAMPLES = [
  "What are researchers working on in autonomous spacecraft?",
  "How is AI being used in space missions?",
  "Which techniques detect spacecraft faults?",
];

/** Solar system orbit animation for the hero section */
function SolarSystem() {
  const planets = [
    { size: 8, orbit: 50, color: "#FF6BCB", speed: "8s", label: "Mercury" },
    { size: 10, orbit: 75, color: "#00D4FF", speed: "12s", label: "Venus" },
    { size: 12, orbit: 100, color: "#6C5CE7", speed: "18s", label: "Earth" },
    { size: 9, orbit: 125, color: "#FFD166", speed: "24s", label: "Mars" },
  ];
  return (
    <div className="relative mx-auto mt-10 h-[280px] w-[280px] sm:h-[320px] sm:w-[320px]" aria-hidden>
      {/* Sun */}
      <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, #FFD166, #F0B830)", boxShadow: "0 0 30px 10px rgba(255,209,102,0.3), 0 0 60px 20px rgba(255,209,102,0.15)" }} />
      {/* Orbit rings and planets */}
      {planets.map((p) => (
        <div key={p.label} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]"
          style={{ width: p.orbit * 2, height: p.orbit * 2 }}>
          <div className="absolute inset-0 animate-orbit" style={{ animationDuration: p.speed }}>
            <div className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{ width: p.size, height: p.size, top: -p.size / 2, background: p.color, boxShadow: `0 0 ${p.size}px ${p.color}40` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="container-eduspace pb-12 pt-16 sm:pt-24">
      <p className="eyebrow animate-rise">Space Research Intelligence</p>
      <h1 className="mt-3 max-w-3xl animate-rise text-4xl font-bold leading-tight sm:text-6xl">
        Explore humanity's knowledge{" "}
        <span className="gradient-text">beyond Earth.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-astro-400">
        Research papers transformed into an interactive map of space science, spacecraft technology and discovery.
      </p>
      <div className="mt-8 max-w-2xl"><SearchBar /></div>
      <div className="mt-4 flex max-w-3xl flex-wrap gap-2">
        {EXAMPLES.map((q) => (
          <Link key={q} to={`/search?q=${encodeURIComponent(q)}`}
            className="rounded-full border border-white/[0.08] bg-white/5 px-3 py-1.5 text-sm text-astro-100 transition-colors hover:bg-white/10 hover:border-nebula-500/30">
            {q}
          </Link>
        ))}
      </div>
      <SolarSystem />
    </section>
  );
}

function Stats() {
  const stats = useAsync(() => api.getStats(), []);
  return (
    <section className="container-eduspace">
      <div className="orbit-divider" />
      <h2 className="eyebrow mb-4">Research Universe</h2>
      <AsyncView state={stats} loading="Counting the stars…">
        {(s) => (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard value={s.papers} label="Research papers" />
              <StatCard value={s.countries} label="Countries" />
              <StatCard value={s.topics} label="Research topics" />
              <StatCard value={s.organizations} label="Organizations" />
            </div>
            {s.synthetic && <p className="mt-3 text-sm text-astro-400">Demo data: these are synthetic records, not real research.</p>}
          </>
        )}
      </AsyncView>
    </section>
  );
}

function Domains() {
  const domains = useAsync(() => api.getDomains(), []);
  return (
    <section className="container-eduspace mt-20">
      <SectionHeader eyebrow="Explore by domain" title="Areas of space research" />
      <AsyncView state={domains}>
        {(ds) => (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ds.map((d) => (
              <GlassCard key={d.id} className="p-4 transition-shadow hover:shadow-neon-purple">
                <p className="font-semibold text-astro-100"><span aria-hidden className="mr-2">{d.icon ?? "🔭"}</span>{d.name}</p>
                <p className="mt-1 text-xs tabular-nums text-astro-400">{d.paper_count.toLocaleString()} papers · {d.topics.length} topics</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {d.topics.map((t) => <Chip key={t} to={`/papers?topic=${encodeURIComponent(t)}`}>{t}</Chip>)}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </AsyncView>
    </section>
  );
}

function Global() {
  const countries = useAsync(() => api.getCountries(), []);
  return (
    <section className="container-eduspace mt-20">
      <SectionHeader eyebrow="Global research" title="Where the research comes from"
        description="Country comes from author affiliation metadata, never guessed from the paper text." />
      <AsyncView state={countries}>
        {(cs) => (
          <div className="glass overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">Papers by country of author affiliation</caption>
              <thead className="border-b border-white/[0.08] text-xs uppercase tracking-wider text-astro-400">
                <tr>
                  <th scope="col" className="px-5 py-3">Country</th>
                  <th scope="col" className="px-5 py-3">Papers</th>
                  <th scope="col" className="px-5 py-3">Top research areas</th>
                </tr>
              </thead>
              <tbody>
                {cs.slice(0, 8).map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]">
                    <th scope="row" className="px-5 py-3 font-medium text-astro-100">
                      <Link to={`/papers?country=${encodeURIComponent(c.name)}`} className="hover:text-cyan-400">
                        <span aria-hidden className="mr-2">{c.flag}</span>{c.name}
                      </Link>
                    </th>
                    <td className="px-5 py-3 tabular-nums text-astro-100">{c.paper_count.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">{c.top_topics.map((t) => <Chip key={t}>{t}</Chip>)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsyncView>
    </section>
  );
}

function Recent() {
  const papers = useAsync(() => api.getRecentPapers(4), []);
  return (
    <section className="container-eduspace mt-20">
      <SectionHeader eyebrow="Featured research" title="Recently published" />
      <AsyncView state={papers}>
        {(ps) => <div className="grid gap-4 lg:grid-cols-2">{ps.map((p) => <PaperCard key={p.paper_id} paper={p} />)}</div>}
      </AsyncView>
    </section>
  );
}

export function ExplorePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Domains />
      <Global />
      <Recent />
    </>
  );
}
