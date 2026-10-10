import Link from "next/link";
import { CitedText, ReferenceList } from "@/components/CitedText";
import { JsonLd } from "@/components/JsonLd";
import { storyText, type ParishStory } from "@/lib/parishStories";
import { articleNode, breadcrumbNode, jsonLdGraph } from "@/lib/structuredData";

export function ParishStoryView({ story }: { story: ParishStory }) {
  const path = `/story/${story.slug}`;
  return (
    <article className="space-y-8">
      <JsonLd
        data={jsonLdGraph([
          articleNode({
            headline: story.title,
            path,
            description: storyText(story),
            date: story.year,
            citation: story.references.map((ref) => ref.title).join("; "),
          }),
          breadcrumbNode([
            { name: "HurlingWiki", path: "/" },
            { name: "Stories", path: "/stories" },
            { name: story.title, path },
          ]),
        ])}
      />
      <header className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-galway-maroon">
          Story · {story.year}
        </p>
        <h1 className="text-4xl font-black tracking-tight text-galway-ink">{story.title}</h1>
        {story.matchHref ? (
          <p>
            <Link href={story.matchHref} className="font-semibold text-galway-maroon underline underline-offset-2">
              {story.matchLabel ?? "The game"}
            </Link>
          </p>
        ) : (
          <p>
            <Link href="/club/fohenagh-historic" className="font-semibold text-galway-maroon underline underline-offset-2">
              Fohenagh
            </Link>
          </p>
        )}
      </header>
      <CitedText
        text={storyText(story)}
        references={story.references}
        className="max-w-2xl text-[1.05rem] leading-relaxed text-galway-ink"
      />
      <ReferenceList
        references={story.references}
        headingClassName="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon"
      />
    </article>
  );
}
