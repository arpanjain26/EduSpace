import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { getRecommendations, type RecommendationKind } from "../api/recommend";
import { AsyncView } from "../components/AsyncView";
import { NeedsApi } from "../components/NeedsApi";
import { Chip, EmptyState, GlassCard, SectionHeader } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import type { Paper } from "../types";

const PAGE_SIZE = 25;

const KINDS: { kind: RecommendationKind; label: string; blurb: string }[] = [
  { kind: "very_similar", label: "Very similar", blurb: "Close in meaning and sharing most of this paper's topics." },
  { kind: "related", label: "Related", blurb: "Shared topics or entities, but a different research method." },
  { kind: "adjacent", label: "Adjacent", blurb: "Neighbouring fields: topics that often appear alongside this paper's." },
];

export function PapersPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const topic = params.get("topic") ?? "";
  const country = params.get("country") ?? "";
  const sortValue = params.get("sort");
  const sort = sortValue === "oldest" || sortValue === "title" ? sortValue : "newest";
  const pageValue = Number(params.get("page") ?? 1);
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const facets = useAsync(() => api.getFacets(), []);
  const papers = useAsync(
    () => api.queryPapers({ q: query, topic, country, sort, page, page_size: PAGE_SIZE }),
    [query, topic, country, sort, page],
  );

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <section className="container-eduspace py-10">
      <p className="eyebrow">Research explorer</p>
      <h1 className="mt-1 text-3xl font-semibold gradient-text">Research papers</h1>
      <p className="mt-2 text-astro-400">Filter the corpus and open an abstract to decide what to read next.</p>

      <div className="mt-6">
        <AsyncView state={facets} loading="Loading research filters…">
          {(available) => (
            <form
              className="glass grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                setFilter("q", String(new FormData(event.currentTarget).get("q") ?? "").trim());
              }}
            >
              <label className="text-sm font-medium text-astro-100">
                Search papers
                <input
                  key={query}
                  name="q"
                  defaultValue={query}
                  placeholder="Words in title or abstract"
                  className="mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-white/5 px-3 font-normal text-astro-100 placeholder:text-astro-400/60 focus:border-nebula-500/40 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-astro-100">
                Topic
                <select
                  aria-label="Filter by topic"
                  value={topic}
                  onChange={(event) => setFilter("topic", event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-white/5 px-3 font-normal text-astro-100"
                >
                  <option value="">All topics</option>
                  {available.topics.map(({ value }) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-astro-100">
                Country
                <select
                  aria-label="Filter by country"
                  value={country}
                  onChange={(event) => setFilter("country", event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-white/5 px-3 font-normal text-astro-100"
                >
                  <option value="">All countries</option>
                  {available.countries.map(({ value }) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-astro-100">
                Sort by
                <select
                  aria-label="Sort papers"
                  value={sort}
                  onChange={(event) => setFilter("sort", event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-white/5 px-3 font-normal text-astro-100"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
                <button type="submit" className="rounded-xl bg-nebula-500 px-4 py-2 text-sm font-medium text-white shadow-neon-purple transition-shadow hover:shadow-neon-cyan">Search</button>
                {(query || topic || country || sort !== "newest") && (
                  <button type="button" onClick={() => setParams({})} className="rounded-xl border border-white/[0.08] bg-white/5 px-4 py-2 text-sm text-astro-100 hover:bg-white/10">
                    Clear filters
                  </button>
                )}
              </div>
            </form>
          )}
        </AsyncView>
      </div>

      <div className="mt-6">
        <AsyncView state={papers} loading="Finding papers…">
          {(result) => (
            <>
              <p className="mb-3 text-sm text-astro-400">
                {result.total === 0 ? "No papers match these filters." : `${((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, result.total)} of ${result.total.toLocaleString()} papers`}
              </p>
              {result.items.length > 0 && (
                <div className="glass overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <caption className="sr-only">Research papers with expandable abstracts</caption>
                    <thead className="border-b border-white/[0.08] text-xs uppercase tracking-wider text-astro-400">
                      <tr>
                        <th scope="col" className="px-4 py-3">Paper</th>
                        <th scope="col" className="px-4 py-3">Authors</th>
                        <th scope="col" className="px-4 py-3">Year</th>
                        <th scope="col" className="px-4 py-3">Topics</th>
                        <th scope="col" className="px-4 py-3">Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((paper) => (
                        <tr key={paper.paper_id} className="border-b border-white/[0.05] align-top last:border-0 hover:bg-white/[0.03]">
                          <th scope="row" className="max-w-sm px-4 py-3 font-medium text-astro-100">
                            <Link to={`/papers/${paper.paper_id}`} className="hover:text-cyan-400">{paper.title}</Link>
                            <details className="mt-2 font-normal">
                              <summary className="w-fit cursor-pointer text-xs text-cyan-500">Read abstract</summary>
                              <p className="mt-2 leading-relaxed text-astro-400">{paper.abstract}</p>
                            </details>
                          </th>
                          <td className="px-4 py-3 text-astro-400">{paper.authors.length ? paper.authors.join(", ") : "Authors not listed"}</td>
                          <td className="px-4 py-3 tabular-nums text-astro-100">{paper.publication_year}</td>
                          <td className="px-4 py-3">
                            <div className="flex max-w-xs flex-wrap gap-1">
                              {paper.derived.topics.map((value) => <Chip key={value} to={`/papers?topic=${encodeURIComponent(value)}`}>{value}</Chip>)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-astro-100">{paper.country ?? "Unknown"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <nav aria-label="Paper results pages" className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setFilter("page", String(page - 1))}
                  className="rounded-xl border border-white/[0.08] bg-white/5 px-4 py-2 text-sm text-astro-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-astro-400">Page {page} of {Math.max(1, Math.ceil(result.total / PAGE_SIZE))}</span>
                <button
                  type="button"
                  disabled={page * PAGE_SIZE >= result.total}
                  onClick={() => setFilter("page", String(page + 1))}
                  className="rounded-xl border border-white/[0.08] bg-white/5 px-4 py-2 text-sm text-astro-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            </>
          )}
        </AsyncView>
      </div>
    </section>
  );
}

function Understanding({ p }: { p: Paper }) {
  const rows: [string, string[], "topic" | "method" | "entity" | "signal"][] = [
    ["Topics", p.derived.topics, "topic"],
    ["Methods", p.derived.methods, "method"],
    ["Technologies", p.derived.technologies, "entity"],
    ["Missions", p.derived.missions, "signal"],
  ];
  return (
    <GlassCard className="p-6">
      <p className="eyebrow">EduSpace understands this paper as</p>
      <dl className="mt-4 space-y-3">
        {rows.filter(([, values]) => values.length > 0).map(([label, values, tone]) => (
          <div key={label} className="flex flex-wrap items-center gap-2">
            <dt className="w-28 text-xs font-semibold uppercase tracking-wider text-astro-400">{label}</dt>
            <dd className="flex flex-wrap gap-1.5">{values.map((v) => <Chip key={v} tone={tone}>{v}</Chip>)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-astro-400">These tags come from the NLP pipeline, kept apart from the original metadata.</p>
    </GlassCard>
  );
}

function Related({ id }: { id: string }) {
  const state = useAsync(() => getRecommendations(id), [id]);
  const [tab, setTab] = useState<RecommendationKind>("very_similar");
  return (
    <AsyncView state={state} loading="Connecting the knowledge…">
      {(r) => (
        <div>
          <div role="tablist" className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button key={k.kind} role="tab" type="button" aria-selected={tab === k.kind} onClick={() => setTab(k.kind)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${tab === k.kind ? "bg-nebula-500 text-white shadow-neon-purple" : "border border-white/[0.08] bg-white/5 text-astro-100 hover:bg-white/10"}`}>
                {k.label} <span className="opacity-70">{r[k.kind].length}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-astro-400">{KINDS.find((k) => k.kind === tab)?.blurb}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {r[tab].length === 0 && <EmptyState title="No strong connection found." />}
            {r[tab].map((x) => (
              <GlassCard key={x.paper.paper_id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/papers/${x.paper.paper_id}`} className="font-semibold leading-snug text-astro-100 hover:text-cyan-400">{x.paper.title}</Link>
                  <span className="shrink-0 rounded-full bg-nebula-500/20 px-2 py-0.5 text-xs font-semibold text-nebula-400">{x.score}%</span>
                </div>
                <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {x.reasons.map((reason) => <li key={reason} className="rounded-full bg-white/5 px-2 py-0.5 text-astro-400">{reason}</li>)}
                </ul>
                <p className="mt-2 text-xs tabular-nums text-astro-400">
                  semantic {x.signals.semantic} · topic {x.signals.topic} · entity {x.signals.entity} · time {x.signals.time}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </AsyncView>
  );
}

export function PaperPage() {
  const { id = "" } = useParams();
  const paper = useAsync(() => api.getPaper(id), [id]);
  return (
    <AsyncView state={paper} loading="Opening the paper…">
      {(p) => !p ? (
        <div className="container-eduspace py-16"><EmptyState title="This paper isn't in the corpus." /></div>
      ) : (
        <article className="container-eduspace space-y-12 py-10">
          <header>
            <Link to="/papers" className="text-sm text-astro-400 hover:text-cyan-400">← Papers</Link>
            {p.is_synthetic && (
              <p role="note" className="mt-3 w-fit rounded-xl bg-pink-500/15 px-3 py-1.5 text-sm text-pink-400">
                Synthetic demo record: not a real paper.
              </p>
            )}
            <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight gradient-text sm:text-4xl">{p.title}</h1>
            <p className="mt-3 text-astro-100">{p.authors.length ? p.authors.join(", ") : "Authors not listed"}</p>
            <p className="mt-2 text-sm text-astro-400">
              {p.publication_date} · {p.journal ?? p.conference ?? "Unknown venue"} · {p.country ?? "Country unknown"} · {p.doi ? `DOI ${p.doi}` : "No DOI"}
            </p>
          </header>
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <section>
              <h2 className="eyebrow">Abstract</h2>
              <p className="mt-3 text-lg leading-relaxed text-astro-100">{p.abstract}</p>
            </section>
            <Understanding p={p} />
          </div>
          <section>
            <SectionHeader eyebrow="Related research" title="Where to read next"
              description="Ranked by meaning together with topic, entity and time overlap, not by text similarity alone." />
            <NeedsApi feature="Recommendations"><Related id={p.paper_id} /></NeedsApi>
          </section>
        </article>
      )}
    </AsyncView>
  );
}
