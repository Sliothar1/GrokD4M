import { SearchBox } from "@/components/SearchBox";
import { EmptyTeach, EntityCard } from "@/components/EntityCard";
import { searchEntities } from "@/lib/data";

export const metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? searchEntities(q) : [];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-black text-galway-ink">Search</h1>
        <p className="text-lg text-galway-ink/70">
          Queries scan every triple — names, years, clubs, and citations.
        </p>
        <SearchBox initialQuery={q} />
      </header>

      {!q.trim() && (
        <EmptyTeach
          title="Type something Galway"
          hint='Try “Joe Canning”, “2017”, or “Galway All-Irelands”. Empty search teaches: the board is ready when you are.'
        />
      )}

      {q.trim() && results.length === 0 && (
        <EmptyTeach
          title={`No hits for “${q.trim()}”`}
          hint="Check spelling, try a year (1980, 2017), a club (Portumna), or a player surname. Community stories live under Stories."
        />
      )}

      {results.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-galway-maroon">
            {results.length} result{results.length === 1 ? "" : "s"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((r) => (
              <EntityCard key={r.id} entity={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
