import Link from "next/link";
import {
  ParishLinks,
  RememberedNote,
  SweeneyMark,
} from "@/components/fohenagh/FohenaghBlocks";
import {
  CuttingExcerpts,
  type CuttingCard,
} from "@/components/player/CuttingExcerpts";
import { InThePapers } from "@/components/player/InThePapers";
import { NotableIntro } from "@/components/player/NotableIntro";
import { PlayerCareer } from "@/components/player/PlayerCareer";
import { CareerTimeline, FactBox } from "@/components/player/CitedAside";
import { ProfileStrip } from "@/components/player/ProfileStrip";
import { CiteMarkers } from "@/components/sources/CiteMarker";
import { SourcesPanel } from "@/components/sources/SourcesPanel";
import { VerificationBadge } from "@/components/sources/VerificationBadge";
import { loadCitationUploads } from "@/lib/articles";
import {
  displayNameForRef,
  getAssoc,
  type getEntity,
} from "@/lib/data";
import { orderCuttingCards } from "@/lib/cuttingOrder";
import {
  isDisplayableVal,
  isPlayerIdentityFact,
  PLAYER_FACT_KEYS,
  playerArchiveNote,
  playerNotableText,
  playerNotesText,
  playerOnPageFactKeys,
  playerSourceOrder,
  pressPraiseLines,
} from "@/lib/entityDisplay";
import { playerClubChips } from "@/lib/playerClubs";
import {
  OWNER_VERIFIED_PLAYERS,
  SWEENEY_PROFILE_IDS,
  TEAM_1959,
} from "@/lib/fohenaghShowcase";
import { fohenaghCitedIntro } from "@/lib/fohenaghPlayerIntro";
import { resolvePlayerPhoto } from "@/lib/playerPhoto";
import {
  cuttingFactKey,
  resolveEntitySources,
} from "@/lib/sources";
import {
  annotateEntityVerification,
  headlineVerificationStatus,
  type FactSourceStatus,
} from "@/lib/verification";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

/** Mick (1959) and Mike (1996) stay on separate profiles. Not a newspaper line. */
function CoenDistinction({ id }: { id: string }) {
  if (id === "player:mick-coen-fohenagh") {
    return (
      <p className="text-sm leading-relaxed text-galway-ink/75">
        Mick Coen of the 1959 side.{" "}
        <Link href="/player/mike-coen-fohenagh" className="font-semibold text-galway-maroon underline">
          Mike Coen
        </Link>
        , named in the 1996 junior championship reports, is a different player.
      </p>
    );
  }
  if (id === "player:mike-coen-fohenagh") {
    return (
      <p className="text-sm leading-relaxed text-galway-ink/75">
        Mike Coen of the 1996 junior side.{" "}
        <Link href="/player/mick-coen-fohenagh" className="font-semibold text-galway-maroon underline">
          Mick Coen
        </Link>
        , named on the 1959 replay fifteen, is a different player.
      </p>
    );
  }
  return null;
}

/**
 * Locked ALL-player profile order — do not reorder:
 * 1) Profile strip  2) Notable (+ secondary note)  3) In the papers
 * 4) Excerpts  5) Career / related  6) Sources
 */
export async function PlayerView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, id } = data;
  const A = await getAssoc();
  const slug = id.startsWith("player:") ? id.slice("player:".length) : id;

  const cuttings = orderCuttingCards(
    related
      .filter((r) => r.kind === "article_upload")
      .map(
        (r): CuttingCard => ({
          id: r.id,
          title: r.title,
          excerpt: r.excerpt,
          citeChip: r.citeChip,
          imagePath: r.imagePath,
          href: r.href,
        })
      )
  );

  const clubs = playerClubChips(id, attrs, related, A);
  const countyName = attrs.county
    ? displayNameForRef(String(attrs.county), A)
    : undefined;
  const notable = playerNotableText(attrs);
  const generatedIntro = fohenaghCitedIntro(id, notable);
  const about = notable || generatedIntro;
  const papers = pressPraiseLines(attrs);
  const note = playerArchiveNote(attrs);
  const notes = playerNotesText(attrs);
  const kidChip =
    attrs.kid_chip && isDisplayableVal(attrs.kid_chip)
      ? String(attrs.kid_chip)
      : null;
  const source = attrs.source ? String(attrs.source) : null;

  const shownFacts = playerOnPageFactKeys(attrs, clubs.length > 0);

  const citations = annotateEntityVerification(
    resolveEntitySources({
      entityId: id,
      attrs,
      cuttings: cuttings.map((cutting) => ({
        id: cutting.id,
        title: cutting.title,
        href: cutting.href,
        citeChip: cutting.citeChip,
        imagePath: cutting.imagePath,
      })),
      uploads: await loadCitationUploads(),
      order: playerSourceOrder(shownFacts),
    }),
    attrs
  );
  const statusOf = (factKey: string): FactSourceStatus =>
    citations.facts.find((fact) => fact.factKey === factKey)?.status ??
    "unverified";
  const badgeFor = (factKey: string) => (
    <VerificationBadge status={statusOf(factKey)} fact={factKey} />
  );
  const profileStatus = OWNER_VERIFIED_PLAYERS.has(id)
    ? "verified"
    : headlineVerificationStatus(citations.facts, isPlayerIdentityFact);
  const beingVerified = String(attrs.status ?? "") === "being_verified";
  const remembered =
    typeof attrs.remembered === "string" && attrs.remembered.trim()
      ? attrs.remembered.trim()
      : null;
  const onFohenagh = clubs.some((club) => club.id === "club:fohenagh-historic");
  const on1959 = (TEAM_1959 as readonly string[]).includes(id);
  const era = on1959
    ? "Fohenagh · 1959 county champions"
    : onFohenagh
      ? "Fohenagh"
      : null;
  const factRows = [
    { label: "Name", value: summary.title },
    clubs.length > 0
      ? { label: "Club", value: clubs.map((club) => club.name).join(", ") }
      : null,
    era ? { label: "Era", value: era } : null,
    isDisplayableVal(attrs.position)
      ? { label: "Position", value: String(attrs.position) }
      : null,
    [attrs.all_ireland_medals, attrs.all_stars].some((value) => isDisplayableVal(value))
      ? {
          label: "Honours",
          value: [attrs.all_ireland_medals, attrs.all_stars]
            .filter((value) => isDisplayableVal(value))
            .map(String)
            .join(" · "),
        }
      : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  const yearIn = (value?: string | null) => value?.match(/\b((?:19|20)\d{2})\b/)?.[1] ?? null;
  const seenTimeline = new Set<string>();
  const timeline = [
    ...related
      .filter((item) => item.kind === "appearance")
      .map((item) => {
        const year = yearIn(item.seasonChip) ?? yearIn(item.subtitle) ?? yearIn(item.title);
        const label = [item.kindLabel ?? item.badge, item.subtitle].filter(Boolean).join(" · ") || item.title;
        return year ? { key: item.id, year, label } : null;
      }),
    ...cuttings.map((cutting) => {
      const year = yearIn(cutting.citeChip) ?? yearIn(cutting.title);
      return year
        ? { key: cutting.id, year, label: cutting.citeChip || cutting.title, href: cutting.href }
        : null;
    }),
  ]
    .filter((item): item is { key: string; year: string; label: string; href?: string } => item !== null)
    .sort((a, b) => a.year.localeCompare(b.year) || a.label.localeCompare(b.label))
    .filter((item) => {
      const stamp = `${item.year}|${item.label}`;
      if (seenTimeline.has(stamp)) return false;
      seenTimeline.add(stamp);
      return true;
    })
    .slice(0, 6);

  const paperThumbs: Record<string, { src: string; href: string; alt: string }> = {};
  for (const cutting of cuttings) {
    if (!cutting.imagePath) continue;
    const articleId = cutting.id.replace(/^article:/, "");
    paperThumbs[articleId] = {
      src: cutting.imagePath,
      href: cutting.href,
      alt: cutting.title,
    };
  }

  const citeFor = (factKey: string) => (
    <CiteMarkers
      numbers={citations.markers[factKey] ?? []}
      sources={citations.sources}
    />
  );

  const citedCuttings = cuttings.map((cutting) => {
    const factKey = cuttingFactKey(cutting.id);
    const numbers = citations.markers[factKey] ?? [];
    const status = statusOf(factKey);
    return {
      ...cutting,
      cite: numbers.length > 0 ? citeFor(factKey) : undefined,
      badge: <VerificationBadge status={status} fact={factKey} />,
    };
  });

  const factKeys = ["kid_chip", ...PLAYER_FACT_KEYS];
  const factCites = Object.fromEntries(
    factKeys.map((key) => [key, citeFor(key)])
  );
  const factBadges = Object.fromEntries(
    factKeys.map((key) => [key, badgeFor(key)])
  );
  const factStatuses = Object.fromEntries(
    factKeys.map((key) => [key, statusOf(key)])
  );

  return (
    <article className="space-y-9">
      <ProfileStrip
        name={summary.title}
        clubs={clubs}
        countyName={countyName}
        photoUrl={resolvePlayerPhoto(slug, attrs)}
        verification={profileStatus}
        clubStatus={clubs.length > 0 ? statusOf("club") : undefined}
        clubCite={beingVerified ? undefined : citeFor("club")}
        clubBadge={
          clubs.length > 0 && !beingVerified ? badgeFor("club") : undefined
        }
        nameMark={SWEENEY_PROFILE_IDS.has(id) ? <SweeneyMark /> : undefined}
        era={era}
        beingVerified={beingVerified}
      />

      <FactBox rows={factRows} />

      {onFohenagh ? <ParishLinks show1959={on1959} /> : null}

      <NotableIntro
        notable={about}
        note={note}
        notes={notes}
        notableCite={notable ? citeFor("notable") : undefined}
        noteCite={citeFor("note")}
        notesCite={citeFor("notes")}
        notableBadge={notable ? badgeFor("notable") : undefined}
        noteBadge={note ? badgeFor("note") : undefined}
        notesBadge={notes ? badgeFor("notes") : undefined}
        notableStatus={notable ? statusOf("notable") : undefined}
        noteStatus={note ? statusOf("note") : undefined}
        notesStatus={notes ? statusOf("notes") : undefined}
      />

      <CoenDistinction id={id} />

      {remembered ? <RememberedNote text={remembered} /> : null}

      <CareerTimeline items={timeline} />

      <InThePapers lines={papers} thumbs={paperThumbs} />

      <CuttingExcerpts cuttings={citedCuttings} />

      <PlayerCareer
        attrs={attrs}
        related={related}
        assoc={A}
        source={source}
        kidChip={kidChip}
        factCites={factCites}
        factBadges={factBadges}
        factStatuses={factStatuses}
      />

      <SourcesPanel sources={citations.sources} legend />
    </article>
  );
}
