import { redirect } from "next/navigation";
import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import { searchPrimaryEntities } from "@/lib/data";

export const metadata = {
  title: "Search",
};

function EmptySearch({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-galway-maroon/30 bg-galway-cream/50 p-8 text-center">
      <p className="text-2xl font-bold text-galway-maroon">{title}</p>
      <p className="mt-3 text-lg text-galway-ink/80">{hint}</p>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const entities = query ? await searchPrimaryEntities(query) : [];

  if (entities.length === 1) {
    redirect(entities[0].href);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-black text-galway-ink">Search</h1>
        <SearchBox initialQuery={query} />
      </header>

      {!query && (
        <EmptySearch
          title="Search for a player or club"
          hint="Type a name in the box above. If we know exactly who you mean, we’ll open their page."
        />
      )}

      {query && entities.length === 0 && (
        <EmptySearch
          title={`No player or club named “${query}”`}
          hint="Try a person or club name — like Jason Lohan or Fohenagh."
        />
      )}

      {entities.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-galway-maroon">
            Which one?
          </h2>
          <p className="text-lg text-galway-ink/70">
            A few players or clubs match “{query}”. Tap a card.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {entities.map((entity) => (
              <EntityCard key={entity.id} entity={entity} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
