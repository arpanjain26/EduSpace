import { useState } from "react";
import { Link } from "react-router-dom";
import { getOpportunities, type Opportunity } from "../api/opportunities";
import { AsyncView } from "../components/AsyncView";
import { NeedsApi } from "../components/NeedsApi";
import { Chip, EmptyState, GlassCard } from "../components/ui";
import { useAsync } from "../hooks/useAsync";

function explain(o: Opportunity): string {
  const n = o.papers === 1 ? "1 paper combines" : `${o.papers} papers combine`;
  return `These topics are semantically close, yet only ${n} them, fewer than the ~${shownTypical(o).toFixed(1)} typical for topic pairs this close. This intersection appears relatively small within the current corpus and may be worth further human investigation.`;
}

function shownTypical(o: Opportunity): number {
  return Math.max(Math.ceil(o.typical * 10) / 10, o.papers + 0.1);
}

function Card({ o, disclaimer }: { o: Opportunity; disclaimer: string }) {
  const bars: [string, number][] = [
    ["Closeness", o.components.closeness], ["Gap", o.components.gap],
    ["Momentum", o.components.momentum], ["Foundation", o.components.foundation],
  ];
  return (
    <GlassCard className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-neon-purple">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold leading-tight text-astro-100">
          {o.topic_a} <span className="text-nebula-400">×</span> {o.topic_b}
        </h3>
        <span className="rounded-full bg-nebula-500/20 px-2 py-0.5 text-xs font-semibold text-nebula-400">{o.score}</span>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {([["Papers", String(o.papers)], ["Typical", `~${shownTypical(o).toFixed(1)}`], ["Last 3 yrs", String(o.recent)]] as const).map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/5 p-2">
            <dt className="text-[11px] text-astro-400">{label}</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-astro-100">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-1.5">
        <Chip tone="signal">{o.momentum === "too few papers" ? "Too few papers to judge a trend" : `Momentum: ${o.momentum}`}</Chip>
        {o.papers < 3 && <Chip tone="entity">Thin evidence</Chip>}
      </div>
      <p className="text-sm leading-relaxed text-astro-400">{explain(o)}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {bars.map(([label, value]) => (
          <div key={label}>
            <div className="flex justify-between text-[11px] text-astro-400"><span>{label}</span><span className="tabular-nums">{value}</span></div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-nebula-500" style={{ width: `${value}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to={`/papers/${o.sample_paper_ids[0]}`} className="rounded-full border border-white/[0.08] bg-white/5 px-3 py-1 text-cyan-400 hover:bg-white/10">Newest paper combining both</Link>
        <Link to={`/search?q=${encodeURIComponent(`${o.topic_a} ${o.topic_b}`)}`} className="rounded-full border border-white/[0.08] bg-white/5 px-3 py-1 text-cyan-400 hover:bg-white/10">Search both</Link>
      </div>
      <p className="mt-auto text-xs italic text-astro-400">{disclaimer}</p>
    </GlassCard>
  );
}

function Signals() {
  const [minPapers, setMinPapers] = useState(1);
  const state = useAsync(() => getOpportunities(minPapers), [minPapers]);
  return (
    <>
      <label className="mt-6 flex items-center gap-2 text-sm text-astro-100">Minimum papers in the overlap
        <select value={minPapers} onChange={(e) => setMinPapers(Number(e.target.value))} className="rounded-lg border border-white/[0.08] bg-white/5 px-2 py-1 text-astro-100">
          {[1, 2, 3, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <div className="mt-6">
        <AsyncView state={state} loading="Analyzing research…">
          {(r) => (
            <>
              <p className="mb-4 text-xs text-astro-400">{r.total} signals. "Typical" = the overlap a regression across all topic pairs predicts for this closeness.</p>
              {r.items.length === 0
                ? <EmptyState title="No signals match." hint="Lower the minimum papers." />
                : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{r.items.map((o) => <Card key={o.id} o={o} disclaimer={r.disclaimer} />)}</div>}
            </>
          )}
        </AsyncView>
      </div>
    </>
  );
}

export function OpportunitiesPage() {
  return (
    <div className="container-eduspace py-10">
      <p className="eyebrow">Research opportunities</p>
      <h1 className="mt-1 text-3xl font-semibold gradient-text">Where might research go next?</h1>
      <GlassCard className="mt-6 p-4 text-sm" style={{ background: "rgba(255,107,203,0.08)" }}>
        <p className="font-semibold text-pink-400">This is a corpus-derived discovery signal, not a validated research gap.</p>
        <p className="mt-1 text-astro-400">A small intersection can be a genuine opening, but it can also mean the combination isn't useful, is studied under other names, or falls outside this corpus. Read the papers before drawing conclusions.</p>
      </GlassCard>
      <NeedsApi feature="Research opportunities"><Signals /></NeedsApi>
    </div>
  );
}
