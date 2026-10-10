/**
 * Era tag vs earliest Fohenagh year, and jersey/subtitle vs Fohenagh.
 * Exits 1 if a rendered profile is still wrong.
 */
import { getAssoc } from "../src/lib/data";
import {
  createPlayerProfileContext,
  earliestFohenaghYear,
  profileForPlayer,
  type ProfileContext,
} from "../src/lib/playerProfile";
import type { TripleVal } from "../src/lib/d4m/AssocArray";

function yearOf(val: unknown): number | null {
  const match = String(val ?? "").match(/\b(?:18|19|20)\d{2}\b/);
  if (!match) return null;
  const year = Number(match[0]);
  return year >= 1880 && year <= 2035 ? year : null;
}

function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

/** The old tag: stored era, else the first year the old reader happened to see. */
function legacyEra(
  attrs: Record<string, TripleVal>,
  apps: Array<{ year?: string; competition?: string }>
): string | null {
  if (typeof attrs.era === "string" && attrs.era.trim()) return attrs.era.trim();
  const years: number[] = [];
  const debut = yearOf(attrs.debut);
  if (debut) years.push(debut);
  for (const app of apps) {
    const year = yearOf(app.year) ?? yearOf(app.competition);
    if (year) years.push(year);
  }
  if (years.length === 0) {
    const cited = yearOf(attrs.cutting_cite);
    if (cited) years.push(cited);
  }
  if (years.length === 0) return null;
  const labels = [...new Set(years.map(decadeOf))].sort();
  return labels.length === 1 ? labels[0] : `${labels[0]}–${labels[labels.length - 1]}`;
}

function renderedDecade(eraLine: string | null): string | null {
  const match = eraLine?.match(/\b(?:18|19|20)\d{2}s\b/);
  return match ? match[0] : null;
}

export async function auditPlayerProfiles(ctx?: ProfileContext) {
  const A = await getAssoc();
  const profileCtx = ctx ?? (await createPlayerProfileContext());
  let players = 0;
  let eraFound = 0;
  let eraFixed = 0;
  let eraRemaining = 0;
  let jerseyFound = 0;
  let jerseyFixed = 0;
  let jerseyRemaining = 0;
  const samples: string[] = [];

  for (const id of A.entitiesOfType("player")) {
    players++;
    const attrs = A.entityAttrs(id);
    const apps = profileCtx.appearancesByPlayer.get(id) ?? [];
    const profile = profileForPlayer(profileCtx, id, attrs);
    const earliestYear = earliestFohenaghYear(attrs, apps);
    const expected = earliestYear ? decadeOf(earliestYear) : null;
    const shown = renderedDecade(profile.eraLine);
    const legacy = legacyEra(attrs, apps);
    const legacyDecade = legacy?.match(/\b(?:18|19|20)\d{2}s\b/)?.[0] ?? null;
    const header = `${profile.headline ?? ""}\n${profile.eraLine ?? ""}`;
    const hasHistoric = [...Object.values(attrs)].some((val) => String(val).includes("club:fohenagh-historic"))
      || String(attrs.club ?? "") === "club:fohenagh-historic";
    const legacyJersey = String(attrs.club ?? "");
    const legacyWasAmalgam =
      /ahascragh-fohenagh/i.test(legacyJersey) ||
      /Ahascragh-Fohenagh/i.test(String(profile.headline ?? "")) === false &&
        /club:ahascragh-fohenagh/i.test(legacyJersey);

    if (expected && legacyDecade && legacyDecade !== expected) eraFound++;
    if (expected && shown !== expected) eraRemaining++;
    else if (expected && legacyDecade && legacyDecade !== expected) eraFixed++;

    const headerHasAmalgam = /Ahascragh[-\s/]Fohenagh/i.test(header);
    const woreAmalgam = /wore the ahascragh-fohenagh jersey/i.test(
      `${profile.headline ?? ""}\n${profile.summary ?? ""}`
    );
    if (/club:ahascragh-fohenagh/i.test(legacyJersey) && hasHistoric) jerseyFound++;
    else if (/club:ahascragh-fohenagh/i.test(legacyJersey) && !hasHistoric) jerseyFound++;
    if (headerHasAmalgam || woreAmalgam) jerseyRemaining++;
    else if (/club:ahascragh-fohenagh/i.test(legacyJersey)) jerseyFixed++;

    if (id === "player:alan-moclair-ahascragh-fohenagh") {
      samples.push(
        [
          "Alan Moclair",
          `before era: ${legacy ?? "(none)"}`,
          `after era: ${profile.eraLine ?? "(none)"}`,
          `before jersey club: ${legacyJersey}`,
          `after headline: ${profile.headline ?? "(empty)"}`,
          `also: ${profile.alsoPlayed.map((club) => club.name).join(", ") || "(none)"}`,
        ].join(" | ")
      );
    }
    void legacyWasAmalgam;
  }

  return { players, eraFound, eraFixed, eraRemaining, jerseyFound, jerseyFixed, jerseyRemaining, samples };
}

async function main() {
  const result = await auditPlayerProfiles();
  console.log(JSON.stringify(result, null, 2));
  if (result.eraRemaining > 0 || result.jerseyRemaining > 0) {
    process.exit(1);
  }
}

const isDirect = process.argv[1]?.includes("audit-player-profiles");
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
