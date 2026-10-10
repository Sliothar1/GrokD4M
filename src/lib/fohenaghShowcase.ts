/**
 * Fohenagh club page helpers.
 * Ids already in the seed. Nothing here mints a player.
 */

import { displayNameForRef } from "@/lib/data";
import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";

export const HERO_CUTTING_ID = "art-ct-1959-09-05-fohenagh-castlegar-portrait";
/** Team picture printed after the 1959 replay. */
export const REPLAY_PICTURE_ID = "art-ct-1959-09-19-fohenagh-team-caption";
export const TITLE_PANEL_ID = "art-ct-1959-09-19-fohenagh-team-caption";

/** Printed Fohenagh XV, Connacht Tribune 19 Sep 1959 replay. */
export const TEAM_1959 = [
  "player:frank-madden",
  "player:jim-moclair-fohenagh",
  "player:pj-killalea-fohenagh",
  "player:tom-moylette-fohenagh",
  "player:mick-coen-fohenagh",
  "player:martin-glynn-fohenagh",
  "player:pj-lally-fohenagh",
  "player:tony-ogorman",
  "player:liam-manning-fohenagh",
  "player:tim-sweeney-fohenagh",
  "player:tommy-glynn-fohenagh",
  "player:jim-sweeney",
  "player:frank-bleahan-fohenagh",
  "player:frank-glynn-fohenagh",
  "player:tim-killalea",
] as const;

/**
 * Named by the owner and already in the seed. The Fohenagh jersey list
 * marks these Verified. No one else is added.
 */
export const OWNER_VERIFIED_PLAYERS = new Set([
  "player:john-devine",
  "player:jimmy-devine-fohenagh",
  "player:tony-kirwan-fohenagh",
  "player:alan-madden",
  "player:gerry-madden-fohenagh",
  "player:raymond-higgins-fohenagh",
  "player:noel-higgins-ahascragh-fohenagh",
  "player:jason-lohan",
  "player:cathal-lohan",
  "player:philip-lohan",
  "player:garry-lohan",
  "player:ollie-deeley",
  "player:sean-moclair",
  "player:seamus-moclair",
  "player:m-barrett-fohenagh",
  "player:mike-flood-fohenagh",
  "player:sean-keane-fohenagh",
  "player:declan-glynn-ahascragh-fohenagh",
  "player:patrick-sweeney-fohenagh",
  "player:tim-sweeney-fohenagh",
  "player:tony-ogorman",
  "player:mick-coen-fohenagh",
  "player:karl-mitchell-fohenagh",
  "player:niall-leonard",
  "player:padraic-leonard",
  "player:shane-glennon-fohenagh",
  "player:cyril-glennon-fohenagh",
  "player:keith-murphy-fohenagh",
  "player:brendan-noone-fohenagh",
  "player:joe-madden-fohenagh",
  "player:kieran-molloy-fohenagh",
  "player:alan-malloy-fohenagh",
  "player:eric-lally-fohenagh",
]);

export const SWEENEY_PROFILE_IDS = new Set([
  "player:tim-sweeney-fohenagh",
  "player:patrick-sweeney-fohenagh",
  "player:jim-sweeney",
  "player:gerry-sweeney-fohenagh",
]);

export function paperHeadline(excerpt?: string | null): {
  title: string;
  dek: string;
} {
  const raw = (excerpt ?? "").replace(/^Headline on the paper:\s*/i, "");
  const [title, dek] = raw.split(/\s+[—–-]\s+/);
  return {
    title: (title || "Fohenagh, 1959").replace(/\.$/, ""),
    dek: (dek || "").replace(/\.$/, ""),
  };
}

export type FohenaghGame = {
  id: string;
  href: string;
  title: string;
  year: number | null;
  when: string | null;
  competition: string | null;
  opponent: string | null;
  score: string | null;
  decade: string;
  sortKey: string;
};

const FOHENAGH_CLUB = "club:fohenagh-historic";
const AMALGAM = "club:ahascragh-fohenagh";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function text(val: TripleVal | undefined): string {
  return val == null ? "" : String(val).trim();
}

function yearOf(attrs: Record<string, TripleVal>): number | null {
  const date = text(attrs.date);
  const fromDate = date.match(/^((?:19|20)\d{2})/);
  if (fromDate) return Number(fromDate[1]);
  const year = text(attrs.year).match(/^((?:19|20)\d{2})/);
  return year ? Number(year[1]) : null;
}

function whenOf(attrs: Record<string, TripleVal>, year: number | null): string | null {
  const date = text(attrs.date);
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month >= 1 && month <= 12) return `${day} ${MONTHS[month - 1]} ${match[1]}`;
  }
  return year ? String(year) : null;
}

function scoreOf(attrs: Record<string, TripleVal>): string | null {
  if (attrs.hide_score === true || text(attrs.hide_score) === "true") return null;
  const score = text(attrs.score);
  if (!score || /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(score)) return null;
  return score;
}

function opponentOf(
  attrs: Record<string, TripleVal>,
  A: AssocArray
): string | null {
  const named = text(attrs.opponent);
  if (named && !named.startsWith("club:")) return named;
  const home = text(attrs.home);
  const away = text(attrs.away);
  const other =
    home === FOHENAGH_CLUB ? away : away === FOHENAGH_CLUB ? home : away || home;
  if (!other || other === FOHENAGH_CLUB) return null;
  return other.startsWith("club:") ? displayNameForRef(other, A) : other;
}

/**
 * County finals the owner asked to show on the club page.
 * Six Galway senior final games (1958, the 1959 draw, the 1959 replay, 1960, 1961, 1963)
 * and the junior final already in the seed.
 */
const FOHENAGH_NOTABLE_IDS = new Set([
  "match:fohenagh-historic-1958-galway-shc-final",
  "match:fohenagh-historic-1959-galway-shc-final-draw",
  "match:fohenagh-historic-1959-galway-shc-final-replay",
  "match:fohenagh-historic-1960-galway-shc-final",
  "match:fohenagh-historic-1961-galway-shc-final",
  "match:fohenagh-historic-1963-galway-shc-final",
  "match:fohenagh-cussane-north-board-junior-final-1942",
]);

/** Seed matches for historic Fohenagh, newest first. Amalgam games stay off this list. */
export function listFohenaghGames(A: AssocArray): FohenaghGame[] {
  const games: FohenaghGame[] = [];
  for (const id of A.entitiesOfType("match:")) {
    const attrs = A.entityAttrs(id);
    if (attrs.same_as) continue;
    const home = text(attrs.home);
    const away = text(attrs.away);
    const club = text(attrs.club) || text(attrs.historic_club);
    const tag = text(attrs.tag);
    const touches =
      home === FOHENAGH_CLUB ||
      away === FOHENAGH_CLUB ||
      club === FOHENAGH_CLUB ||
      tag === "fohenagh-historic";
    if (!touches) continue;
    if (home === AMALGAM || away === AMALGAM || club === AMALGAM) continue;
    const year = yearOf(attrs);
    const iso = text(attrs.date).match(/^\d{4}-\d{2}-\d{2}$/)
      ? text(attrs.date)
      : year
        ? `${year}-00-00`
        : "";
    games.push({
      id,
      href: `/match/${id.slice("match:".length)}`,
      title: text(attrs.name) || "Fohenagh game",
      year,
      when: whenOf(attrs, year),
      competition: text(attrs.competition) || null,
      opponent: opponentOf(attrs, A),
      score: scoreOf(attrs),
      decade: year ? `${Math.floor(year / 10) * 10}s` : "Year not on file",
      sortKey: iso,
    });
  }
  games.sort((a, b) => b.sortKey.localeCompare(a.sortKey) || a.title.localeCompare(b.title));
  return games;
}

/** Notable games on the Fohenagh club page: the county finals the owner picked. */
export function listFohenaghNotableGames(A: AssocArray): FohenaghGame[] {
  return listFohenaghGames(A).filter((game) => FOHENAGH_NOTABLE_IDS.has(game.id));
}

/** Line icon for a row in More great games. Omit on an entry for crossed hurls. */
export type FohenaghGameIcon = "hurls" | "helmet" | "shield" | "tank";

export type FohenaghMoreGame = FohenaghGame & { icon: FohenaghGameIcon };

/**
 * More great games, the dropdown under the A–Z player roll.
 * Add a line to show another match page. Order here is the order on the page.
 * The county finals stay in their own list. This one is the other days.
 * Set `icon` for a battle-worn day. Anything else draws crossed hurls.
 */
export const FOHENAGH_MORE_GAMES: { id: string; icon?: FohenaghGameIcon }[] = [
  { id: "match:fohenagh-ahascragh-sadie-kilcommons-final" },
  { id: "match:galway-shc-1971-r1-athenry-fohenagh" },
  { id: "match:galway-reeves-cup-1967-final-athenry-fohenagh" },
  { id: "match:galway-reeves-cup-1966-final-athenry-fohenagh" },
  { id: "match:fohenagh-loughrea-c1957" },
  { id: "match:fohenagh-maree-1957" },
  { id: "match:fohenagh-tynagh-junior-abandoned-1956", icon: "helmet" },
  { id: "match:fohenagh-skehana-ihc-final-1952-draw" },
  { id: "match:fohenagh-cussane-north-board-junior-final-1942" },
];

export function listFohenaghMoreGames(A: AssocArray): FohenaghMoreGame[] {
  const byId = new Map(listFohenaghGames(A).map((game) => [game.id, game]));
  const games: FohenaghMoreGame[] = [];
  for (const entry of FOHENAGH_MORE_GAMES) {
    const game = byId.get(entry.id);
    if (!game) continue;
    games.push({ ...game, icon: entry.icon ?? "hurls" });
  }
  return games;
}
