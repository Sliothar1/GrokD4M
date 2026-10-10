import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-galway-maroon/20 bg-galway-cream/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8">
        <div className="flex flex-col gap-2 text-sm text-galway-ink/80 sm:flex-row sm:justify-between">
          <p>
            HurlingWiki — a place to find a hurling club, a match, and the players who wore the jersey.
          </p>
          <p>
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
        <p className="text-sm text-galway-ink/70">
          <Link href="/how-it-works" className="font-semibold text-galway-maroon underline">
            How this site works
          </Link>
        </p>
        <p className="text-xs text-galway-ink/50">
          HurlingWiki was designed and built by Garry Lohan.
        </p>
      </div>
    </footer>
  );
}
