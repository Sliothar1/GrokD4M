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
import {
  displayNameForRef,
  getAssoc,
  playerProfileChip,
  playerTrustLabel,
  type getEntity,
} from "@/lib/data";
import { orderCuttingCards } from "@/lib/cuttingOrder";
import {
  isDisplayableVal,
  PLAYER_FACT_KEYS,
  playerArchiveNote,
  playerNotableText,
} from "@/lib/entityDisplay";
import { playerClubChips } from "@/lib/playerClubs";
import {
  playerPhotoUploadHref,
  resolvePlayerPhoto,
} from "@/lib/playerPhoto";
import {
  cuttingFactKey,
  resolveEntitySources,
  type SourceOrderSlot,
} from "@/lib/sources";

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

  const trust = playerTrustLabel(attrs, summary.confidence);
  const verified =
    playerProfileChip(attrs, summary.confidence, cuttings.length) ===
    "Verified";
  const clubs = playerClubChips(id, attrs, related, A);
  const countyName = attrs.county
    ? displayNameForRef(String(attrs.county), A)
    : undefined;
  const notable = playerNotableText(attrs);
  const note = playerArchiveNote(attrs);
  const kidChip =
    attrs.kid_chip && isDisplayableVal(attrs.kid_chip)
      ? String(attrs.kid_chip)
      : null;
  const source = attrs.source ? String(attrs.source) : null;

  const shownFacts = new Set<string>();
  if (clubs.length > 0) shownFacts.add("club");
  if (notable) shownFacts.add("notable");
  if (note) shownFacts.add("note");
  if (kidChip) shownFacts.add("kid_chip");
  for (const key of PLAYER_FACT_KEYS) {
    if (isDisplayableVal(attrs[key])) shownFacts.add(key);
  }
  const sourceOrder: SourceOrderSlot[] = (
    [
      { fact: "club" },
      { fact: "notable" },
      { fact: "note" },
      { cuttings: true },
      { fact: "kid_chip" },
      ...PLAYER_FACT_KEYS.map((fact): SourceOrderSlot => ({ fact })),
    ] satisfies SourceOrderSlot[]
  ).filter((slot): slot is SourceOrderSlot =>
    "cuttings" in slot ? true : shownFacts.has(slot.fact)
  );

  const citations = resolveEntitySources({
    entityId: id,
    attrs,
    cuttings: cuttings.map((cutting) => ({
      id: cutting.id,
      title: cutting.title,
      href: cutting.href,
      citeChip: cutting.citeChip,
      imagePath: cutting.imagePath,
    })),
    order: sourceOrder,
  });

  const citeFor = (factKey: string) => (
    <CiteMarkers
      numbers={citations.markers[factKey] ?? []}
      sources={citations.sources}
    />
  );

  const citedCuttings = cuttings.map((cutting) => {
    const numbers = citations.markers[cuttingFactKey(cutting.id)] ?? [];
    return {
      ...cutting,
      cite: numbers.length > 0 ? citeFor(cuttingFactKey(cutting.id)) : undefined,
    };
  });

  const factCites = Object.fromEntries(
    ["kid_chip", ...PLAYER_FACT_KEYS].map((key) => [key, citeFor(key)])
  );

  return (
    <article className="space-y-9">
      <ProfileStrip
        name={summary.title}
        clubs={clubs}
        countyName={countyName}
        photoUrl={resolvePlayerPhoto(slug, attrs)}
        photoUploadHref={playerPhotoUploadHref(id)}
        verified={verified}
        trustLabel={trust}
        clubCite={citeFor("club")}
      />

      <NotableIntro
        notable={notable}
        note={note}
        notableCite={citeFor("notable")}
        noteCite={citeFor("note")}
      />

      <CuttingExcerpts cuttings={citedCuttings} playerName={summary.title} />

      <PlayerCareer
        attrs={attrs}
        related={related}
        assoc={A}
        source={source}
        kidChip={kidChip}
        factCites={factCites}
      />

      <SourcesPanel sources={citations.sources} />

      <DeveloperTriples triples={triples} />
    </article>
  );
}
