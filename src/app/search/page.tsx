import { SearchBox } from "@/components/SearchBox";
import { EmptyTeach, EntityCard } from "@/components/EntityCard";
import { groupSearchResults, searchEntities } from "@/lib/data";

export const metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchEntities(q) : [];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-black text-galway-ink">Search</h1>
        <p className="text-lg text-galway-ink/70">
          Queries scan every triple — names, years, clubs, citations, and cuttings (excerpt + YYYY · Paper). Upload on Stories.
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
          hint="Check spelling, try a year (1980, 2017), a club (Portumna), or a player surname. No cuttings yet — try a club or year, or upload on Stories."
        />
      )}

      {results.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-galway-maroon">
            {results.length} result{results.length === 1 ? "" : "s"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {groupSearchResults(results).map((group) =>
              group.seasonChip && (group.items.length > 1 || group.key.startsWith("season:")) ? (
                <div
                  key={group.key}
                  className="space-y-3 sm:col-span-2 rounded-2xl border-2 border-galway-maroon/15 bg-galway-cream/40 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-galway-maroon px-3 py-1 text-sm font-bold text-white">
                      {group.seasonChip}
                    </span>
                    {group.items
                      .map((r) => r.seasonChip)
                      .filter((y): y is string => Boolean(y))
                      .filter((y, i, arr) => arr.indexOf(y) === i)
                      .map((y) => (
                        <span
                          key={y}
                          className="inline-flex rounded-full border border-galway-maroon/30 bg-white px-2 py-0.5 text-xs font-bold text-galway-maroon"
                        >
                          {y}
                        </span>
                      ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.map((r) => (
                      <EntityCard key={r.id} entity={r} />
                    ))}
                  </div>
                </div>
              ) : (
                <EntityCard key={group.items[0].id} entity={group.items[0]} />
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
