import { DeveloperTriples } from "@/components/DeveloperTriples";
import {
  CuttingExcerpts,
  type CuttingCard,
} from "@/components/player/CuttingExcerpts";
import { NotableIntro } from "@/components/player/NotableIntro";
import { PlayerCareer } from "@/components/player/PlayerCareer";
import { ProfileStrip } from "@/components/player/ProfileStrip";
import {
  displayNameForRef,
  entityHref,
  getAssoc,
  isVerifiedFromCutting,
  playerClubIds,
  playerTrustLabel,
  type getEntity,
} from "@/lib/data";
import {
  isDisplayableVal,
  playerArchiveNote,
  playerNotableText,
} from "@/lib/entityDisplay";
import {
  playerPhotoUploadHref,
  resolvePlayerPhoto,
} from "@/lib/playerPhoto";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

/**
 * Locked ALL-player profile order — do not reorder:
 * 1) Profile strip  2) Notable (+ secondary note)  3) Excerpts
 * 4) Career / related  5) For developers
 */
export async function PlayerView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, triples, id } = data;
  const A = await getAssoc();
  const slug = id.startsWith("player:") ? id.slice("player:".length) : id;

  const cuttings = related
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
    );

  const trust = playerTrustLabel(attrs, summary.confidence);
  const namedOnCutting =
    isVerifiedFromCutting(attrs) || cuttings.length > 0;
  const verified = namedOnCutting || trust === "Verified";
  const appearanceClubs = related
    .filter((r) => r.kind === "appearance")
    .map((r) => {
      const club = A.entityAttrs(r.id).club;
      return club ? String(club) : "";
    })
    .filter(Boolean);
  const clubIds = playerClubIds(attrs, appearanceClubs);
  const clubChips = clubIds.map((clubId) => ({
    id: clubId,
    href: entityHref(clubId, "club"),
    label: displayNameForRef(clubId, A),
  }));
  const clubName = attrs.club
    ? displayNameForRef(String(attrs.club), A)
    : undefined;
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

  return (
    <article className="space-y-8">
      <ProfileStrip
        name={summary.title}
        clubName={clubName}
        countyName={countyName}
        photoUrl={resolvePlayerPhoto(slug, attrs)}
        photoUploadHref={playerPhotoUploadHref(id)}
        verified={verified}
        trustLabel={trust}
        clubChips={clubChips}
      />

      <NotableIntro notable={notable} note={note} />

      <CuttingExcerpts cuttings={cuttings} playerName={summary.title} />

      <PlayerCareer
        attrs={attrs}
        related={related}
        assoc={A}
        source={source}
        kidChip={kidChip}
      />

      <DeveloperTriples triples={triples} />
    </article>
  );
}
