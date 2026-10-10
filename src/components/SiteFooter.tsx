import Link from "next/link";
import { GrokBotExtra } from "@/components/fohenagh/GrokBotExtra";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-galway-maroon/20 bg-galway-cream/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8">
        <div className="flex flex-col gap-2 text-sm text-galway-ink/80 sm:flex-row sm:justify-between">
          <p>
            HurlingWiki Phase 1 — kid-friendly Galway senior hurling facts, powered by a
            D4M-style associative array.
          </p>
          <p>
            Learn D4M at{" "}
            <a
              className="font-semibold text-galway-maroon underline"
              href="https://d4m.mit.edu/"
              target="_blank"
              rel="noopener noreferrer"
            >
              d4m.mit.edu
            </a>
            {" · "}
            <Link href="/about" className="font-semibold text-galway-maroon underline">
              About
            </Link>
          </p>
        </div>
        <p className="text-xs text-galway-ink/50">
          HurlingWiki was designed and built by Garry Lohan, on MIT&apos;s D4M data model.
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
        <GrokBotExtra />
      </div>
    </footer>
  );
}
