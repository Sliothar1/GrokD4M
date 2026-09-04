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
      <h2 className="text-2xl font-bold text-galway-maroon">Article clip</h2>
      {clips.length === 0 ? (
        <div
          className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-galway-maroon/25 bg-galway-cream/50 px-4 py-8 text-center"
          role="status"
        >
          <p className="text-lg font-bold text-galway-ink/70">
            Article clip coming soon
          </p>
          <p className="mt-1 max-w-md text-sm text-galway-ink/55">
            When a newspaper cutting or upload is linked to this match, a
            thumbnail will show here with caption and cite.
          </p>
          <Link
            href="/stories#upload"
            className="mt-3 text-sm font-semibold text-galway-maroon underline"
          >
            Upload on Stories
          </Link>
        </div>
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
