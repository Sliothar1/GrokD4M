import type { Metadata } from "next";
import Link from "next/link";
import { getAssoc, summarizeEntity } from "@/lib/data";

export const metadata: Metadata = {
  title: "Find a club",
};

export default async function ClubsPage() {
  const A = await getAssoc();
  const clubs = A.entitiesOfType("club")
    .filter((id) => !A.entityAttrs(id).same_as)
    .map((id) => summarizeEntity(id, A))
    .filter((club): club is NonNullable<typeof club> => Boolean(club))
    .sort((a, b) => a.title.localeCompare(b.title, "en"));
  const featured = clubs.find((club) => club.id === "club:fohenagh-historic");
  const rest = clubs.filter((club) => club.id !== "club:fohenagh-historic");

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-black text-galway-ink sm:text-5xl">Find a club</h1>
        <p className="text-xl leading-relaxed text-galway-ink/85">
          Every club uses the same page. Fohenagh is the club filled in so far.
        </p>
      </header>
      {featured ? (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-galway-maroon">
            On the site now
          </h2>
          <Link
            href={featured.href}
            className="block rounded-2xl border-2 border-galway-maroon/20 bg-white px-4 py-3 text-xl font-bold text-galway-ink hover:border-galway-maroon"
          >
            {featured.title}
          </Link>
        </section>
      ) : null}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">Clubs</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {rest.map((club) => (
            <li key={club.id}>
              <Link
                href={club.href}
                className="block rounded-xl border border-galway-maroon/15 bg-white px-3 py-2 font-semibold text-galway-ink hover:border-galway-maroon"
              >
                {club.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
