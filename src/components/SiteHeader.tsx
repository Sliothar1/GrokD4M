import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/stories", label: "Stories" },
  { href: "/stories#upload", label: "Upload" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="border-b-4 border-galway-gold bg-galway-maroon text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="group">
          <span className="block text-2xl font-black tracking-tight sm:text-3xl">
            HurlingWiki
          </span>
          <span className="text-sm text-galway-cream/90 group-hover:underline">
            Galway first, Ireland next
          </span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-2 text-base font-semibold hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-galway-gold"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
