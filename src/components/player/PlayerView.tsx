import { DeveloperTriples } from "@/components/DeveloperTriples";
import { EntityCard } from "@/components/EntityCard";
import { CuttingsGallery, type CuttingCard } from "@/components/player/CuttingsGallery";
import { EmptyMediaState } from "@/components/player/EmptyMediaState";
import { FactDefinitionList } from "@/components/player/FactDefinitionList";
import { HonourStatStrip } from "@/components/player/HonourStatStrip";
import { PlayerBio } from "@/components/player/PlayerBio";
import { PlayerHero } from "@/components/player/PlayerHero";
import {
  parseCiteChip,
  pressCiteForArticle,
  readArticleUploads,
} from "@/lib/articles";
import {
  displayNameForRef,
  friendlyAttrLabel,
  getAssoc,
  isVerifiedFromCutting,
  playerTrustLabel,
  type getEntity,
} from "@/lib/data";
import {
  isDisplayableVal,
  playerBioText,
  PLAYER_FACT_KEYS,
} from "@/lib/entityDisplay";

type EntityPayload = NonNullable<Awaited<ReturnType<typeof getEntity>>>;

export async function PlayerView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, triples } = data;
  const A = await getAssoc();
  const uploads = await readArticleUploads();
  const uploadById = new Map(uploads.map((a) => [a.id, a]));

  const cuttings = related
    .filter((r) => r.kind === "article_upload")
    .map((r): CuttingCard => {
      const artId = r.id.startsWith("article:") ? r.id.slice("article:".length) : r.id;
      const upload = uploadById.get(artId);
      const press = upload
        ? pressCiteForArticle(upload)
        : parseCiteChip(r.citeChip);
      return {
        id: r.id,
        title: r.title,
        excerpt: r.excerpt,
        citeChip: r.citeChip,
        imagePath: r.imagePath,
        href: r.href,
        paper: press.paper,
        date: press.date,
        page: press.page,
        headline: upload?.caption || r.title,
      };
    });

  const otherRelated = related.filter((r) => r.kind !== "article_upload");
  const appearances = otherRelated.filter((r) => r.kind === "appearance");
  const relatedRail = otherRelated
    .filter((r) => r.kind !== "appearance")
    .slice(0, 12);

  const trust = playerTrustLabel(attrs, summary.confidence);
  const namedOnCutting =
    isVerifiedFromCutting(attrs) || cuttings.length > 0;
  const clubName = attrs.club
    ? displayNameForRef(String(attrs.club), A)
    : undefined;
  const countyName = attrs.county
    ? displayNameForRef(String(attrs.county), A)
    : undefined;
  const bio = playerBioText(attrs);
  const kidChip =
    attrs.kid_chip && isDisplayableVal(attrs.kid_chip)
      ? String(attrs.kid_chip)
      : null;
  const cuttingCite =
    attrs.cutting_cite && isDisplayableVal(attrs.cutting_cite)
      ? String(attrs.cutting_cite)
      : summary.citeChip;
  const source = attrs.source ? String(attrs.source) : null;

  const facts = PLAYER_FACT_KEYS.filter((k) => isDisplayableVal(attrs[k])).map(
    (k) => ({
      key: k,
      label: friendlyAttrLabel(k),
      value: attrs[k],
    })
  );

  const honourStats = [
    cuttings.length > 0
      ? { label: "Cuttings", value: String(cuttings.length) }
      : null,
    appearances.length > 0
      ? { label: "Panels", value: String(appearances.length) }
      : null,
    namedOnCutting ? { label: "Paper", value: "Named" } : null,
    isDisplayableVal(attrs.all_ireland_medals)
      ? { label: "All-Irelands", value: String(attrs.all_ireland_medals) }
      : null,
    isDisplayableVal(attrs.all_stars)
      ? { label: "All Stars", value: String(attrs.all_stars) }
      : null,
    appearances.some((a) => a.seasonChip)
      ? {
          label: "Seasons",
          value: appearances
            .map((a) => a.seasonChip)
            .filter(Boolean)
            .slice(0, 3)
            .join(" · "),
        }
      : null,
  ].filter((s): s is { label: string; value: string } => Boolean(s));

  return (
    <article className="space-y-8">
      <PlayerHero
        name={summary.title}
        clubName={clubName}
        countyName={countyName}
        trust={trust}
        namedOnCutting={namedOnCutting}
        kidChip={kidChip}
        citeChip={cuttingCite}
      />

      <HonourStatStrip stats={honourStats} />

      {cuttings.length > 0 ? (
        <CuttingsGallery cuttings={cuttings} playerName={summary.title} />
      ) : (
        <EmptyMediaState />
      )}

      {bio ? <PlayerBio text={bio} /> : null}

      <FactDefinitionList
        facts={facts}
        appearances={appearances.map((a) => ({
          id: a.id,
          label: [a.kindLabel ?? a.badge, a.seasonChip ?? a.subtitle]
            .filter(Boolean)
            .join(" · "),
        }))}
        source={source}
        A={A}
      />

      {relatedRail.length > 0 ? (
        <section>
          <h2 className="mb-3 text-2xl font-bold text-galway-maroon">Related</h2>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
            {relatedRail.map((r) => (
              <div key={r.id} className="w-[min(78vw,18rem)] shrink-0 snap-start">
                <EntityCard entity={r} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <DeveloperTriples triples={triples} />
    </article>
  );
}
