import Link from "next/link";
import { ArticleClipSection } from "@/components/ArticleClip";
import { ClubChip, TrustChip } from "@/components/chips";
import { PhotoComingSoon } from "@/components/fohenagh/FohenaghBlocks";
import { SuggestCorrection } from "@/components/SuggestCorrection";
import { EntityCard } from "@/components/EntityCard";
import { LoughreaFinalStoryChips } from "@/components/HistoricFohenaghBlock";
import {
  CuttingExcerpts,
  type CuttingCard,
} from "@/components/player/CuttingExcerpts";
import { playerIdsOnMatch } from "@/lib/articles";
import { hasPlayQualifier, publicCite, publicHeading, scrubPublicCopy } from "@/lib/publicCopy";
import {
  displayNameForRef,
  friendlyAttrLabel,
  friendlyTrustLabel,
  getAssoc,
  isEntityRef,
  type getEntity,
} from "@/lib/data";
import {
  isDisplayableVal,
  MATCH_FACT_KEYS,
} from "@/lib/entityDisplay";
import {
  parseClubIds,
  toClubChip,
  type ClubChipData,
} from "@/lib/playerClubs";
import { fohenaghGameReport } from "@/lib/fohenaghMatchReports";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

/** Match page: header, report, the players named that day, then the cuttings. */
export async function MatchView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, id } = data;
  const A = await getAssoc();
  const source = attrs.source ? String(attrs.source) : null;
  const trust =
    summary.trustLabel ??
    friendlyTrustLabel(summary.confidence) ??
    (attrs.confidence ? friendlyTrustLabel(String(attrs.confidence)) : undefined);

  const isHistoricMatch =
    id.startsWith("match:fohenagh-historic-") ||
    id.startsWith("match:ahascragh-historic-") ||
    String(attrs.tag ?? "") === "historic-predecessor" ||
    String(attrs.tag ?? "") === "fohenagh-historic";
  const hideScore =
    attrs.hide_score === true || String(attrs.hide_score ?? "") === "true";

  const clubs = matchClubChips(attrs, related, A);
  const cuttings = related
    .filter((r) => r.kind === "article_upload")
    .map(
      (r): CuttingCard => ({
        id: r.id,
        title: publicHeading(r.title, r.citeChip || "Newspaper cutting"),
        excerpt: r.excerpt && !hasPlayQualifier(r.excerpt) ? r.excerpt : undefined,
        citeChip: r.citeChip,
        imagePath: r.imagePath,
        href: r.href,
      })
    );

  const scoreText = matchScoreText(attrs, hideScore);
  const facts: Array<{ key: string; label: string; value: string }> = [];
  for (const k of MATCH_FACT_KEYS) {
    if (k === "score") {
      if (scoreText) {
        facts.push({ key: k, label: friendlyAttrLabel(k), value: scoreText });
      }
      continue;
    }
    if (!isDisplayableVal(attrs[k])) continue;
    const raw = String(attrs[k]);
    // Hide machine slugs like fohenagh-win. Plain win / loss / draw stay.
    if (k === "result" && isMachineSlug(raw)) continue;
    if (k === "opponent" && isDisplayableVal(attrs.away)) {
      const awayName = isEntityRef(attrs.away)
        ? displayNameForRef(String(attrs.away), A)
        : String(attrs.away);
      if (raw.toLowerCase() === awayName.toLowerCase()) continue;
    }
    facts.push({ key: k, label: friendlyAttrLabel(k), value: raw });
  }
  const citeFacts = matchCiteFacts(attrs);

  const lineup =
    attrs.lineup_home && isDisplayableVal(attrs.lineup_home)
      ? String(attrs.lineup_home)
      : null;
  const parishReport = fohenaghGameReport(id);
  const namedPlayers = parishReport ? await playersNamedOnGame(id, lineup, A) : [];
  const matchPath = `/match/${id.startsWith("match:") ? id.slice("match:".length) : id}`;

  const otherRelated = related.filter(
    (r) =>
      r.kind !== "article_upload" &&
      r.kind !== "appearance" &&
      r.kind !== "club"
  );
  const subtitle = kidMatchSubtitle(summary.subtitle, scoreText);

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon/80">
          Match
        </p>
        <h1 className="text-[1.75rem] font-black leading-[1.15] tracking-tight text-galway-ink sm:text-4xl">
          {summary.title}
        </h1>
        {subtitle ? (
          <p className="text-lg font-semibold text-galway-ink/70">
            {subtitle}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5">
          <TrustChip label={trust} />
          {isHistoricMatch ? (
            <span className="rounded-full bg-galway-maroon px-2.5 py-0.5 text-sm font-bold text-white">
              Historic
            </span>
          ) : null}
          {(summary.citeChip || attrs.cutting_cite) && (
            <span className="rounded-full border border-galway-maroon/25 px-2.5 py-0.5 text-sm font-bold text-galway-maroon">
              {publicCite(summary.citeChip || String(attrs.cutting_cite))}
            </span>
          )}
          {(summary.scoreDisputed ||
            attrs.score_disputed === true ||
            String(attrs.score_disputed ?? "") === "true") && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-bold uppercase text-amber-900">
              score disputed
            </span>
          )}
          {clubs.map((c) => (
            <ClubChip key={c.id} href={c.href} label={c.name} title={c.title} />
          ))}
        </div>
      </header>

      {parishReport ? <PhotoComingSoon note="Championship team photo" /> : null}

      {parishReport ? (
        <section className="max-w-3xl space-y-3" aria-labelledby="match-report-heading">
          <h2 id="match-report-heading" className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
            Match report
          </h2>
          {parishReport.paragraphs.length === 0 ? (
            <p className="text-lg text-galway-ink/75">Report coming soon.</p>
          ) : (
            parishReport.paragraphs.map((paragraph) => {
              const clean = scrubPublicCopy(paragraph);
              if (!clean) return null;
              return (
              <p key={paragraph} className="text-lg leading-relaxed text-galway-ink">
                {clean}
              </p>
              );
            })
          )}
          {parishReport.cite ? (
            <p className="text-sm font-semibold text-galway-ink/60">{parishReport.cite}</p>
          ) : null}
        </section>
      ) : attrs.notable || attrs.note || attrs.excerpt ? (
        <MatchBlurb text={String(attrs.notable ?? attrs.note ?? attrs.excerpt)} />
      ) : null}

      {parishReport ? (
        <section className="space-y-3" aria-labelledby="named-players-heading">
          <h2 id="named-players-heading" className="text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
            Players named that day
          </h2>
          {namedPlayers.length === 0 ? (
            <p className="text-base text-galway-ink/70">
              Names will appear here when a cutting names them.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {namedPlayers.map((player) => (
                <li key={player.id}>
                  <Link
                    href={player.href}
                    className="inline-flex rounded-full border border-galway-maroon/20 bg-white px-3 py-1 text-sm font-semibold text-galway-maroon underline-offset-2 hover:underline"
                  >
                    {player.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {(id === "match:galway-shc-2025-final" || id === "club:loughrea") && (
        <LoughreaFinalStoryChips />
      )}

      {(parishReport || isHistoricMatch) && (
        <ArticleClipSection
          matchId={id}
          cuttingsJson={
            attrs.cuttings != null ? String(attrs.cuttings) : null
          }
        />
      )}

      {parishReport ? (
        <SuggestCorrection variant="clipping" page={matchPath} pageLabel={summary.title} />
      ) : null}

      {!parishReport && cuttings.length > 0 ? (
        <CuttingExcerpts
          cuttings={cuttings}
          heading="Newspaper cuttings"
        />
      ) : null}

      {facts.length > 0 || citeFacts.length > 0 || lineup ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
            Match facts
          </h2>
          <dl className="flex flex-wrap gap-2">
            {[...facts, ...citeFacts].map((f) => (
              <div
                key={f.key}
                className="rounded-full border border-galway-maroon/12 bg-white px-3 py-1.5"
              >
                <dt className="inline text-[11px] font-bold uppercase tracking-wide text-galway-ink/45">
                  {f.label}{" "}
                </dt>
                <dd className="inline text-sm font-bold text-galway-ink">
                  <FactValue value={f.value} assoc={A} />
                </dd>
              </div>
            ))}
          </dl>
          {lineup ? (
            <p className="mt-3 text-sm leading-relaxed text-galway-ink/65">
              <span className="font-bold text-galway-maroon">XV · </span>
              {lineup}
            </p>
          ) : null}
          {source && source.startsWith("http") ? (
            <p className="mt-3 text-sm text-galway-ink/50">
              Cite:{" "}
              <a
                href={source}
                className="font-semibold text-galway-maroon underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the source
              </a>
            </p>
          ) : null}
        </section>
      ) : null}

      {otherRelated.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-galway-maroon">
            Related
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherRelated.slice(0, 8).map((r) => (
              <EntityCard key={r.id} entity={r} />
            ))}
          </div>
        </section>
      ) : null}

      <SuggestCorrection page={matchPath} pageLabel={summary.title} />
    </article>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Slug-like tokens only: entity prefixes (`club:`, `player:`) and hyphenated
 * machine ids (`fohenagh-win`). Plain words (win, loss, draw) stay visible.
 */
function isMachineSlug(val: string): boolean {
  const s = val.trim();
  if (!s) return false;
  if (/^[a-z_]+:/i.test(s)) return true;
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/i.test(s);
}

/** Score column, or `score_home` / `score_away` joined when `score` is absent. */
function matchScoreText(
  attrs: EntityPayload["attrs"],
  hideScore: boolean
): string | null {
  if (hideScore) return null;
  if (isDisplayableVal(attrs.score)) return String(attrs.score);
  const home = isDisplayableVal(attrs.score_home)
    ? String(attrs.score_home).trim()
    : "";
  const away = isDisplayableVal(attrs.score_away)
    ? String(attrs.score_away).trim()
    : "";
  if (home && away) return `${home} / ${away}`;
  if (home || away) return home || away;
  return null;
}

function isoDayMonYear(year: string, month: string, day: string): string | null {
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  if (!Number.isInteger(d) || d < 1 || d > 31) return null;
  return `${d} ${MONTHS[m - 1]} ${year}`;
}

/**
 * `1959-09-15 · Connacht Sentinel` → `Connacht Sentinel 15 Sep 1959`.
 * Same stored paper and date; only the reading order changes.
 */
function catalogCiteText(val: string): string {
  const m = val.trim().match(/^(\d{4})-(\d{2})-(\d{2})\s*·\s*(.+)$/);
  if (!m) return val;
  const pretty = isoDayMonYear(m[1], m[2], m[3]);
  if (!pretty) return val;
  return `${m[4].trim()} ${pretty}`;
}

function isCiteFactKey(key: string): boolean {
  if (/^catalog_cite/.test(key)) return true;
  if (key === "cite_paper" || key.endsWith("_cite_paper")) return true;
  return false;
}

function isExtraSourceLink(key: string, val: unknown): boolean {
  return (
    key.startsWith("source_") &&
    typeof val === "string" &&
    val.trim().startsWith("http")
  );
}

function matchCiteFacts(attrs: EntityPayload["attrs"]): Array<{
  key: string;
  label: string;
  value: string;
}> {
  const keys = Object.keys(attrs)
    .filter((k) => {
      if (!isDisplayableVal(attrs[k])) return false;
      if (isCiteFactKey(k)) return true;
      return isExtraSourceLink(k, attrs[k]);
    })
    .sort((a, b) => a.localeCompare(b));

  return keys.map((k) => {
    const raw = String(attrs[k]);
    const value = /^catalog_cite(_\d+)?$/.test(k) ? catalogCiteText(raw) : raw;
    return { key: k, label: friendlyAttrLabel(k), value };
  });
}

async function playersNamedOnGame(
  matchId: string,
  lineup: string | null,
  A: Awaited<ReturnType<typeof getAssoc>>
): Promise<Array<{ id: string; name: string; href: string }>> {
  const ids = new Set(await playerIdsOnMatch(matchId));
  if (lineup) {
    for (const playerId of playerIdsMatchingLineup(lineup, A)) ids.add(playerId);
  }
  return [...ids]
    .filter((playerId) => Object.keys(A.entityAttrs(playerId)).length > 0)
    .map((playerId) => ({
      id: playerId,
      name: displayNameForRef(playerId, A),
      href: `/player/${playerId.slice("player:".length)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** Exact printed names only. A shared name is left as text, not guessed. */
function playerIdsMatchingLineup(
  lineup: string,
  A: Awaited<ReturnType<typeof getAssoc>>
): string[] {
  const wanted = new Set(
    lineup
      .split(/[,;]|\band\b/i)
      .map((part) => part.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim().toLowerCase())
      .filter((part) => part.length > 2)
  );
  if (wanted.size === 0) return [];
  const hits = new Map<string, string[]>();
  for (const triple of A.getcol("name")) {
    if (!String(triple.row).startsWith("player:")) continue;
    const key = String(triple.val).replace(/\s+/g, " ").trim().toLowerCase();
    if (!wanted.has(key)) continue;
    const list = hits.get(key) ?? [];
    list.push(String(triple.row));
    hits.set(key, list);
  }
  const ids: string[] = [];
  for (const list of hits.values()) {
    if (list.length === 1) ids.push(list[0]);
  }
  return ids;
}

function kidMatchSubtitle(
  subtitle: string | undefined,
  scoreText: string | null
): string | undefined {
  if (scoreText) return scoreText;
  if (!subtitle) return undefined;
  const cleaned = subtitle
    .split(" · ")
    .filter((part) => part.trim() && !isMachineSlug(part))
    .join(" · ");
  return cleaned || undefined;
}

function FactValue({
  value,
  assoc,
}: {
  value: EntityPayload["attrs"][string] | string;
  assoc: Awaited<ReturnType<typeof getAssoc>>;
}) {
  if (isEntityRef(value)) {
    const ref = String(value);
    return (
      <Link
        href={
          ref.startsWith("player:")
            ? `/player/${ref.slice(7)}`
            : ref.startsWith("club:")
              ? `/club/${ref.slice(5)}`
              : `/search?q=${encodeURIComponent(ref)}`
        }
        className="text-galway-maroon underline"
      >
        {displayNameForRef(ref, assoc)}
      </Link>
    );
  }
  if (typeof value === "string" && value.startsWith("http")) {
    return (
      <a
        href={value}
        className="font-semibold text-galway-maroon underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {value}
      </a>
    );
  }
  const clean = scrubPublicCopy(String(value));
  return clean ? <>{clean}</> : null;
}

function MatchBlurb({ text }: { text: string }) {
  const clean = scrubPublicCopy(text);
  if (!clean) return null;
  return (
    <p className="border-l-[3px] border-galway-gold pl-4 text-lg font-medium leading-snug text-galway-ink">
      {clean}
    </p>
  );
}

function matchClubChips(
  attrs: EntityPayload["attrs"],
  related: EntityPayload["related"],
  A: Awaited<ReturnType<typeof getAssoc>>
): ClubChipData[] {
  const ids = new Set<string>();
  for (const key of ["club", "historic_club", "home", "away", "winner"] as const) {
    for (const id of parseClubIds(attrs[key])) ids.add(id);
  }
  for (const r of related) {
    if (r.kind === "club") ids.add(r.id);
  }
  return [...ids]
    .filter((id) => Object.keys(A.entityAttrs(id)).length > 0)
    .map((id) => toClubChip(id, A));
}
