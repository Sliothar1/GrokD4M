import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="prose-like max-w-3xl space-y-6">
      <h1 className="text-4xl font-black text-galway-ink sm:text-5xl">About HurlingWiki</h1>
      <p className="text-xl leading-relaxed text-galway-ink/85">
        HurlingWiki is a wiki for every hurling club. Look up a parish, read the
        matches, and follow the players who wore the jersey.
      </p>

      <section className="space-y-3 rounded-2xl border-2 border-galway-maroon/15 bg-white p-6">
        <h2 className="text-2xl font-bold text-galway-maroon">How a page gets here</h2>
        <p className="text-lg leading-relaxed">
          A reader sends a newspaper cutting or a short club memory. An editor
          reads it before it is published. A line from a paper stays cited. A
          club memory is labelled Remembered, and it is kept apart from the papers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">A note on how it is built</h2>
        <p className="text-lg leading-relaxed">
          The pages sit on an idea from MIT called D4M, a quiet way of keeping
          many small facts about players, clubs, and matches. You can read more at{" "}
          <a
            href="https://d4m.mit.edu/"
            className="font-bold text-galway-maroon underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            d4m.mit.edu
          </a>
          .
        </p>
      </section>

      <section className="space-y-2 border-t border-galway-maroon/15 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-galway-maroon/75">
          Built by
        </h2>
        <p className="text-sm leading-relaxed text-galway-ink/75">
          HurlingWiki was designed and built by Garry Lohan.{" "}
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
