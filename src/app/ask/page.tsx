import type { Metadata } from "next";
import Link from "next/link";
import { AskForm } from "@/components/AskForm";
import { askRecords } from "@/lib/askRecords";
import { withPageMeta } from "@/lib/site";

export const metadata: Metadata = withPageMeta({ title: "Ask a question", path: "/ask" });
export const dynamic = "force-dynamic";

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q?.trim() ?? "";
  const answer = q ? await askRecords(q) : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-galway-ink">Ask a question</h1>
        <p className="max-w-2xl text-lg text-[color:var(--text-muted)]">
          Answers come from the games, players, and stories already cited on HurlingWiki.
        </p>
      </header>
      <AskForm initial={q} inputId="ask-page-q" />
      {answer ? (
        <section className="space-y-4" aria-live="polite">
          {answer.empty ? (
            <p className="text-xl font-semibold text-galway-ink">Not in our records yet</p>
          ) : (
            <ul className="space-y-4">
              {answer.hits.map((hit) => (
                <li key={`${hit.href}-${hit.text}`} className="max-w-2xl rounded-2xl border border-galway-maroon/15 bg-white p-4">
                  <p className="text-[1.05rem] leading-relaxed text-galway-ink">{hit.text}</p>
                  <p className="mt-2 text-sm">
                    <Link href={hit.href} className="font-semibold text-galway-maroon underline underline-offset-2">
                      {hit.source}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
