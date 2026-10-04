import { DeveloperTriples } from "@/components/DeveloperTriples";
import {
  CuttingExcerpts,
  type CuttingCard,
} from "@/components/player/CuttingExcerpts";
import { NotableIntro } from "@/components/player/NotableIntro";
import { PlayerCareer } from "@/components/player/PlayerCareer";
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
} from "@/lib/entityDisplay";
import { playerClubChips } from "@/lib/playerClubs";
import {
  playerPhotoUploadHref,
  resolvePlayerPhoto,
} from "@/lib/playerPhoto";
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

/**
 * Locked ALL-player profile order — do not reorder:
 * 1) Profile strip  2) Notable (+ secondary note)  3) Excerpts
 * 4) Career / related  5) Sources  6) For developers
 */
export async function PlayerView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, triples, id } = data;
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
  const profileStatus = headlineVerificationStatus(
    citations.facts,
    isPlayerIdentityFact
  );

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
        photoUploadHref={playerPhotoUploadHref(id)}
        verification={profileStatus}
        clubStatus={clubs.length > 0 ? statusOf("club") : undefined}
        clubCite={citeFor("club")}
        clubBadge={clubs.length > 0 ? badgeFor("club") : undefined}
      />

      <NotableIntro
        notable={notable}
        note={note}
        notes={notes}
        notableCite={citeFor("notable")}
        noteCite={citeFor("note")}
        notesCite={citeFor("notes")}
        notableBadge={notable ? badgeFor("notable") : undefined}
        noteBadge={note ? badgeFor("note") : undefined}
        notesBadge={notes ? badgeFor("notes") : undefined}
        notableStatus={notable ? statusOf("notable") : undefined}
        noteStatus={note ? statusOf("note") : undefined}
        notesStatus={notes ? statusOf("notes") : undefined}
      />

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

      <DeveloperTriples triples={triples} />
    </article>
  );
}
