import { SearchBox } from "@/components/SearchBox";
import { EntityCard } from "@/components/EntityCard";
import { searchWiki, type EntitySummary } from "@/lib/data";
import { withPageMeta } from "@/lib/site";

export const metadata = withPageMeta({ title: "Search", path: "/search" });

function ResultGroup({
  title,
  entities,
}: {
  title: string;
  entities: EntitySummary[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold text-galway-maroon">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {entities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>
    </section>
  );
}

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
  const entities = query ? await searchWiki(query) : [];
  const people = entities.filter((entity) => entity.kind === "player" || entity.kind === "club" || entity.kind === "team");
  const games = entities.filter((entity) => entity.kind === "match");
  const clippings = entities.filter((entity) => entity.kind === "article_upload");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-black text-galway-ink">Search</h1>
        <SearchBox initialQuery={query} />
      </header>

      {!query && (
        <EmptySearch
          title="Search the wiki"
          hint="Type a name. Players, the games they played, and clippings that name them are listed below."
        />
      )}

      {query && entities.length === 0 && (
        <EmptySearch
          title={`Nothing matched “${query}”`}
          hint="Try a player, a club, or a game."
        />
      )}

      {people.length > 0 ? (
        <ResultGroup title="People" entities={people} />
      ) : null}
      {games.length > 0 ? (
        <ResultGroup title="Games" entities={games} />
      ) : null}
      {clippings.length > 0 ? (
        <ResultGroup title="Clippings" entities={clippings} />
      ) : null}
    </div>
  );
}
