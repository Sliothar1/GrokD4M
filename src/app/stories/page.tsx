import type { Metadata } from "next";
import { EntityCard, EmptyTeach } from "@/components/EntityCard";
import { StoryForm } from "@/components/StoryForm";
import { officialStories, readPendingStories } from "@/lib/data";

export const metadata: Metadata = {
  title: "Stories",
};

export const dynamic = "force-dynamic";

export default function StoriesPage() {
  const seeded = officialStories();
  const pending = readPendingStories();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-galway-ink">Community stories</h1>
        <p className="text-lg text-galway-ink/75">
          Memories linked to players, finals, and clubs. Seeded stories are illustrative;
          new submissions stay in a pending file — never blended into official stats.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">In the seed</h2>
        {seeded.length === 0 ? (
          <EmptyTeach
            title="No seeded stories yet"
            hint="When stories appear in seed.json with type community_story, they show up here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {seeded.map((s) => (
              <EntityCard key={s.id} entity={s} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">Pending (local queue)</h2>
        {pending.length === 0 ? (
          <EmptyTeach
            title="Queue is empty"
            hint="Submit a story below. It will be saved to data/pending-stories.json on this machine."
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border-2 border-dashed border-galway-gold bg-white p-4"
              >
                <p className="text-xs font-bold uppercase text-galway-gold">Pending</p>
                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="text-sm text-galway-ink/60">
                  by {p.author}
                  {p.linkedEntity ? ` · linked ${p.linkedEntity}` : ""}
                </p>
                <p className="mt-2 text-base">{p.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StoryForm />
    </div>
  );
}
