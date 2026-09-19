import Link from "next/link";
import {
  getMatchArticleClips,
  type MatchArticleClip,
} from "@/lib/articles";

/** Newspaper / article snapshot on historic match pages. */
export async function ArticleClipSection({
  matchId,
  cuttingsJson,
}: {
  matchId: string;
  /** Optional JSON string of {imageUrl, caption?, cite?}[] from match attrs */
  cuttingsJson?: string | null;
}) {
  const clips = await getMatchArticleClips(matchId, cuttingsJson);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
        Article clip
      </h2>
      {clips.length === 0 ? (
        <p className="text-sm text-galway-ink/55" role="status">
          Article clip coming soon — a thumbnail will show here when a cutting
          is linked.{" "}
          <Link
            href="/stories#upload"
            className="font-semibold text-galway-maroon underline"
          >
            Upload on Stories
          </Link>
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {clips.map((clip) => (
            <ArticleClipCard key={clip.key} clip={clip} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ArticleClipCard({ clip }: { clip: MatchArticleClip }) {
  const inner = (
    <>
      <div className="overflow-hidden rounded-xl bg-galway-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={clip.imageUrl}
          alt={clip.caption || "Article cutting"}
          className="mx-auto max-h-56 w-full object-contain"
        />
      </div>
      {clip.caption && (
        <p className="mt-2 text-base font-semibold text-galway-ink">
          {clip.caption}
        </p>
      )}
      {clip.cite && (
        <p className="mt-1 text-sm text-galway-ink/60">{clip.cite}</p>
      )}
    </>
  );

  return (
    <li className="rounded-2xl border border-galway-maroon/15 bg-white p-3 shadow-sm">
      {clip.href ? (
        <Link href={clip.href} className="block hover:opacity-95">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}
