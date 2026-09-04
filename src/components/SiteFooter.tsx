import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-galway-maroon/20 bg-galway-cream/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-galway-ink/80 sm:flex-row sm:justify-between">
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
    </footer>
  );
}
