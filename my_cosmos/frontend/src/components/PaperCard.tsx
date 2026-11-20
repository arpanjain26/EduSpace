import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Paper } from "../types";
import { Chip, GlassCard } from "./ui";

export function PaperCard({ paper, aside }: { paper: Paper; aside?: ReactNode }) {
  const venue = paper.journal ?? paper.conference;
  return (
    <GlassCard className="flex animate-rise flex-col gap-4 p-5 transition-shadow hover:shadow-neon-purple sm:flex-row">
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug text-astro-100">
          <Link to={`/papers/${paper.paper_id}`} className="hover:text-cyan-400">{paper.title}</Link>
        </h3>
        <p className="mt-1 text-xs text-astro-400">
          {paper.authors.join(", ")} · {paper.publication_year}
          {venue && ` · ${venue}`}
          {paper.country && ` · ${paper.country}`}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-astro-400">{paper.abstract}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {paper.derived.topics.map((t) => <Chip key={t} to={`/papers?topic=${encodeURIComponent(t)}`}>{t}</Chip>)}
          {paper.derived.methods.map((m) => <Chip key={m} tone="method">{m}</Chip>)}
        </div>
      </div>
      {aside}
    </GlassCard>
  );
}
