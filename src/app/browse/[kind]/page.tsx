import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listBrowsePlayers } from "@/lib/browsePlayers";
import { getAssoc } from "@/lib/data";
import { PARISH_STORIES } from "@/lib/parishStories";
import { withPageMeta } from "@/lib/site";

export const dynamic = "force-dynamic";

const KINDS = ["games", "players", "decades", "stories"] as const;
type Kind = (typeof KINDS)[number];

function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string }>;
}): Promise<Metadata> {
  const { kind } = await params;
  const title = isKind(kind) ? kind.charAt(0).toUpperCase() + kind.slice(1) : "Browse";
  return withPageMeta({ title, path: `/browse/${kind}` });
}

function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

function yearOf(value: unknown): number | null {
  const match = String(value ?? "").match(/\b(?:18|19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ decade?: string }>;
}) {
  const { kind } = await params;
  if (!isKind(kind)) notFound();
  const decade = (await searchParams).decade?.trim() ?? "";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-galway-maroon">Browse</p>
        <h1 className="text-4xl font-black capitalize text-galway-ink">{kind}</h1>
      </header>
      {kind === "stories" ? <StoryList /> : null}
      {kind === "decades" ? <DecadeList /> : null}
      {kind === "games" ? <GameList decade={decade} /> : null}
      {kind === "players" ? <PlayerList decade={decade} /> : null}
    </div>
  );
}

function StoryList() {
  return (
    <ul className="max-w-2xl space-y-3">
      {PARISH_STORIES.map((story) => (
        <li key={story.slug}>
          <Link href={`/story/${story.slug}`} className="font-semibold text-galway-maroon underline underline-offset-2">
            {story.title}
          </Link>
          <span className="text-[color:var(--text-muted)]"> · {story.year}</span>
        </li>
      ))}
    </ul>
  );
}

function DecadeList() {
  const decades = ["1890s", "1900s", "1910s", "1920s", "1930s", "1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  return (
    <ul className="flex flex-wrap gap-2">
      {decades.map((label) => (
        <li key={label}>
          <Link href={`/browse/players?decade=${label}`} className="inline-block rounded-full border border-galway-maroon/20 bg-white px-3 py-1 font-semibold text-galway-maroon">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function GameList({ decade }: { decade: string }) {
  const A = await getAssoc();
  const rows = A.entitiesOfType("match")
    .map((id) => {
      const attrs = A.entityAttrs(id);
      if (attrs.same_as) return null;
      const blob = `${id} ${attrs.tag ?? ""} ${attrs.home ?? ""} ${attrs.club ?? ""}`;
      if (!/fohenagh/i.test(blob)) return null;
      const year = yearOf(attrs.year) ?? yearOf(attrs.date) ?? yearOf(attrs.name);
      return {
        href: `/match/${id.slice("match:".length)}`,
        title: String(attrs.name ?? id),
        decade: year ? decadeOf(year) : "Undated",
        year: year ?? 0,
      };
    })
    .filter((row): row is { href: string; title: string; decade: string; year: number } => Boolean(row))
    .filter((row) => !decade || row.decade === decade)
    .sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));

  return (
    <ul className="max-w-2xl space-y-2">
      {rows.map((row) => (
        <li key={row.href}>
          <Link href={row.href} className="font-semibold text-galway-maroon underline underline-offset-2">
            {row.title}
          </Link>
          <span className="text-[color:var(--text-muted)]"> · {row.decade}</span>
        </li>
      ))}
    </ul>
  );
}

async function PlayerList({ decade }: { decade: string }) {
  const rows = (await listBrowsePlayers()).filter((row) => !decade || row.decades.includes(decade));

  return (
    <div className="space-y-3">
      {decade ? (
        <p className="text-[color:var(--text-muted)]">
          {decade} · <Link href="/browse/players" className="underline">All decades</Link>
        </p>
      ) : null}
      <ul className="grid gap-1 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.href}>
            <Link href={row.href} className="font-semibold text-galway-maroon underline underline-offset-2">
              {row.title}
            </Link>
            <span className="text-sm text-[color:var(--text-muted)]"> · {row.decade}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
