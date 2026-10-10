import Link from "next/link";
import { AskForm } from "@/components/AskForm";
import { SearchBox } from "@/components/SearchBox";
import { PARISH_STORIES } from "@/lib/parishStories";

const games = [
  { href: "/match/fohenagh-claregalway-1941-county-semi", label: "1941 semi-final" },
  { href: "/match/fohenagh-cussane-1944-ina", label: "1943 final, played 1944" },
  { href: "/match/fohenagh-erins-hope-camogie-final-1947", label: "1947 camogie final" },
  { href: "/match/fohenagh-historic-1959-galway-shc-final-replay", label: "1959 senior replay" },
  { href: "/match/fohenagh-tynagh-junior-abandoned-1956", label: "1956, five men went to hospital" },
  { href: "/match/fohenagh-tynagh-1956-hurls", label: "1956 at Kiltormer" },
  { href: "/browse/games", label: "All games" },
];

const decades = ["1930s", "1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];

export function SiteHeader() {
  return (
    <header className="border-b-4 border-galway-gold bg-galway-maroon text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="group">
          <span className="block text-2xl font-black tracking-tight sm:text-3xl">
            HurlingWiki
          </span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
          <Link href="/search" className="nav-link">Find a name</Link>
          <Link href="/club/fohenagh-historic" className="nav-link">Fohenagh</Link>
          <details className="nav-menu">
            <summary>Games</summary>
            <ul>
              {games.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </details>
          <details className="nav-menu">
            <summary>Players</summary>
            <ul>
              <li><Link href="/browse/players">All players</Link></li>
              <li><Link href="/club/fohenagh-historic">Fohenagh roll</Link></li>
              <li><Link href="/browse/decades">By decade</Link></li>
            </ul>
          </details>
          <details className="nav-menu">
            <summary>Decades</summary>
            <ul>
              {decades.map((label) => (
                <li key={label}>
                  <Link href={`/browse/players?decade=${label}`}>{label}</Link>
                </li>
              ))}
            </ul>
          </details>
          <details className="nav-menu">
            <summary>Stories</summary>
            <ul>
              {PARISH_STORIES.map((story) => (
                <li key={story.slug}>
                  <Link href={`/story/${story.slug}`}>{story.title}</Link>
                </li>
              ))}
              <li><Link href="/stories#record">All stories</Link></li>
            </ul>
          </details>
          <Link href="/ask" className="nav-link">Ask</Link>
          <Link href="/about" className="nav-link">About</Link>
        </nav>
      </div>
      <div className="mx-auto max-w-5xl space-y-3 px-4 pb-4">
        <SearchBox />
        <AskForm inputId="ask-header-q" />
      </div>
    </header>
  );
}
