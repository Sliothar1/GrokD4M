import type { Metadata } from "next";
import { demoStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  const stats = demoStats();

  return (
    <div className="prose-like max-w-3xl space-y-6">
      <h1 className="text-4xl font-black text-galway-ink sm:text-5xl">About HurlingWiki</h1>
      <p className="text-xl leading-relaxed text-galway-ink/85">
        HurlingWiki is a kid-friendly knowledge site for <strong>Galway senior hurling</strong>.
        Brand line: <em>Galway first, Ireland next</em>. Phase 1 shows how MIT&apos;s D4M
        associative arrays can hold sports facts as sparse triples.
      </p>

      <section className="space-y-3 rounded-2xl border-2 border-galway-maroon/15 bg-white p-6">
        <h2 className="text-2xl font-bold text-galway-maroon">What is D4M?</h2>
        <p className="text-lg leading-relaxed">
          <strong>D4M</strong> means <em>Dynamic Distributed Dimensional Data Model</em>. It
          was developed at <strong>MIT Lincoln Laboratory</strong>, with foundational work by{" "}
          <strong>Jeremy Kepner</strong> and collaborators. Associative arrays let you store
          and query sparse multi-dimensional data using simple algebra-like operations —
          perfect for linking players, clubs, matches, and sources without a heavy schema.
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
        <h2 className="text-2xl font-bold text-galway-maroon">How this demo works</h2>
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

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">Sources</h2>
        <p className="text-lg leading-relaxed">
          Seed citations point at public Wikipedia and GAA-style pages. On the site we show
          friendly trust labels (<em>Verified</em>, <em>Needs check</em>, <em>Fan story</em>)
          instead of raw confidence jargon. No fake live APIs — what you see is the local seed.
        </p>
      </section>
    </div>
  );
}
