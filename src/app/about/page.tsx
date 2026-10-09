import type { Metadata } from "next";
import { demoStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const stats = await demoStats();

  return (
    <div className="prose-like max-w-3xl space-y-6">
      <h1 className="text-4xl font-black text-galway-ink sm:text-5xl">About HurlingWiki</h1>
      <p className="text-xl leading-relaxed text-galway-ink/85">
        HurlingWiki is a Hurling Knowledge Site that shows how MIT&apos;s D4M associative
        arrays can hold sports facts as sparse triples.
      </p>

      <section className="space-y-3 rounded-2xl border-2 border-galway-maroon/15 bg-white p-6">
        <h2 className="text-2xl font-bold text-galway-maroon">What is D4M?</h2>
        <p className="text-lg leading-relaxed">
          <strong>D4M</strong> means <em>Dynamic Distributed Dimensional Data Model</em>. It
          was developed at{" "}
          <a
            href="https://www.ll.mit.edu/"
            className="font-bold text-galway-maroon hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT Lincoln Laboratory
          </a>, with foundational work by{" "}
          <a
            href="https://www.ll.mit.edu/biographies/jeremy-kepner"
            className="font-bold text-galway-maroon hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jeremy Kepner
          </a>{" "}
          and collaborators. Associative arrays let you store
          and query sparse multi-dimensional data using simple algebra-like operations —
          perfect for linking players, clubs, and matches without a heavy schema.
        </p>
        <p className="text-lg">
          Official site:{" "}
          <a
            href="https://d4m.mit.edu/"
            className="font-bold text-galway-maroon underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://d4m.mit.edu/
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">How it works</h2>
        <ul className="list-disc space-y-2 pl-6 text-lg">
          <li>
            Seed facts live in <code className="rounded bg-galway-cream px-1">data/seed.json</code>{" "}
            as <code className="rounded bg-galway-cream px-1">(row, col, val)</code> triples.
          </li>
          <li>
            <code className="rounded bg-galway-cream px-1">AssocArray</code> supports{" "}
            <code className="rounded bg-galway-cream px-1">getrow</code>,{" "}
            <code className="rounded bg-galway-cream px-1">getcol</code>, and simple{" "}
            <code className="rounded bg-galway-cream px-1">search</code>.
          </li>
          <li>
            Right now the board holds <strong>{stats.nnz}</strong> triples across{" "}
            <strong>{stats.rows}</strong> rows.
          </li>
          <li>
            Community stories you submit go to{" "}
            <code className="rounded bg-galway-cream px-1">data/pending-stories.json</code> and
            never mix into official stats.
          </li>
        </ul>
      </section>

      <section className="space-y-2 border-t border-galway-maroon/15 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-galway-maroon/75">
          Built by
        </h2>
        <p className="text-sm leading-relaxed text-galway-ink/75">
          HurlingWiki was designed and built by Garry Lohan, on MIT&apos;s D4M data model.{" "}
          <a
            href="https://scholar.google.com/citations?user=9aBECzQAAAAJ&hl=en"
            className="font-semibold text-galway-maroon underline decoration-galway-maroon/40 underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Scholar
          </a>
          {" · "}
          <a
            href="https://www.linkedin.com/in/garry-lohan-14923814"
            className="font-semibold text-galway-maroon underline decoration-galway-maroon/40 underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </p>
        <p className="flex items-start gap-2 text-sm leading-relaxed text-galway-ink/65">
          <span
            role="img"
            title="grok (v.): to understand so thoroughly it becomes part of you — Heinlein, 1961."
            aria-label="grok (v.): to understand so thoroughly it becomes part of you — Heinlein, 1961."
            className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded-full bg-galway-maroon px-1.5 text-[10px] font-bold leading-none tracking-wide text-galway-cream"
          >
            G
          </span>
          <span>
            <span className="font-semibold text-galway-ink/75">How it was built. </span>
            Built with help from{" "}
            <a
              href="https://x.ai"
              className="font-bold text-galway-maroon hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Grok Bot
            </a>
            <sup
              title="The answer to life, the universe and everything"
              className="ml-px align-super text-[9px] font-medium text-galway-ink/40"
            >
              42
            </sup>, an AI assistant, for research and coding — every fact is cited and checked
            before it goes live.
          </span>
        </p>
      </section>
    </div>
  );
}
