import { linkedCuttingCountsFor } from "@/lib/articles";
import {
  isClubAttrColumn,
  isNumberedClubCol,
  isSeasonClubCol,
} from "@/lib/clubColumns";
import {
  displayNameForRef,
  entityHref,
  linkedCuttingCount,
  playerClubIds,
  playerProfileChip,
  summarizeEntity,
  type EntitySummary,
} from "@/lib/data";
import type { AssocArray, TripleVal } from "@/lib/d4m/AssocArray";

/** Locked three-club model — never collapse these into one jersey. */
export const LOCKED_CLUB_ORDER = [
  "club:fohenagh-historic",
  "club:ahascragh-historic",
  "club:ahascragh-fohenagh",
] as const;

const AF_CLUB_ID = "club:ahascragh-fohenagh";

export type ClubChipData = {
  id: string;
  name: string;
  href: string;
  /**
   * Hover title. Fohenagh historic is “Fohenagh”.
   * Ahascragh historic keeps “Before Ahascragh-Fohenagh”.
   */
  title: string;
};

/** Pull every `club:…` id out of a triple value (single ref or a list). */
export function parseClubIds(val: unknown): string[] {
  if (typeof val !== "string") return [];
  const matches = val.match(/club:[a-z0-9][a-z0-9-]*/gi);
  if (!matches?.length) return [];
  return [...new Set(matches.map((id) => id.toLowerCase()))];
}

export function collectClubIdsFromAttrs(
  attrs: Record<string, TripleVal>
): string[] {
  const ids = new Set<string>();
  for (const [key, val] of Object.entries(attrs)) {
    if (isClubAttrColumn(key)) {
      for (const id of parseClubIds(val)) ids.add(id);
    }
    if (key.startsWith("club:") && parseClubIds(key).length) {
      ids.add(key.toLowerCase());
    }
  }
  return [...ids];
}

function sortClubIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const ia = LOCKED_CLUB_ORDER.indexOf(a as (typeof LOCKED_CLUB_ORDER)[number]);
    const ib = LOCKED_CLUB_ORDER.indexOf(b as (typeof LOCKED_CLUB_ORDER)[number]);
    if (ia !== -1 || ib !== -1) {
      return (ia === -1 ? 100 : ia) - (ib === -1 ? 100 : ib);
    }
    return a.localeCompare(b);
  });
}

/** Public chip. The team name only — no “historic” suffix on the jersey. */
export function clubChipLabel(clubId: string, A: AssocArray): string {
  return displayNameForRef(clubId, A);
}

export function clubChipTitle(clubId: string, label: string): string {
  if (clubId === "club:fohenagh-historic") return "Fohenagh";
  if (clubId === "club:ahascragh-historic") return "Before Ahascragh-Fohenagh";
  return label;
}

export function toClubChip(clubId: string, A: AssocArray): ClubChipData {
  const name = clubChipLabel(clubId, A);
  return {
    id: clubId,
    name,
    href: entityHref(clubId, "club"),
    title: clubChipTitle(clubId, name),
  };
}

/**
 * Every jersey a player wore, from seed attrs + appearance clubs + related clubs.
 * Does not invent clubs — only existing refs.
 */
export function playerClubChips(
  playerId: string,
  attrs: Record<string, TripleVal>,
  related: EntitySummary[],
  A: AssocArray
): ClubChipData[] {
  const ids = new Set(collectClubIdsFromAttrs(attrs));

  for (const r of related) {
    if (r.kind === "club") ids.add(r.id);
    if (r.kind === "appearance") {
      for (const id of parseClubIds(A.get(r.id, "club"))) ids.add(id);
    }
  }

  if (playerId.startsWith("player:")) {
    for (const t of A.getcol("player")) {
      if (t.val !== playerId) continue;
      if (!String(t.row).startsWith("appearance:")) continue;
      for (const id of parseClubIds(A.get(t.row, "club"))) ids.add(id);
    }
  }

  // Garry Lohan is Fohenagh only. The alias row used to name the amalgam.
  if (playerId === "player:garry-lohan") {
    ids.delete(AF_CLUB_ID);
  }

  return sortClubIds([...ids])
    .filter((id) => Object.keys(A.entityAttrs(id)).length > 0)
    .map((id) => toClubChip(id, A));
}

export type ClubRosterRow = {
  summary: EntitySummary;
  alsoClubs: ClubChipData[];
  /** Same chip as the player profile strip: Verified or Needs check. */
  trust: string;
  /**
   * True when this jersey is only a numbered extra (`club_1`, …) with no
   * source on that column. Named `club` / `also_club` links are not pending.
   */
  linkPending: boolean;
};

const HISTORIC_CLUB_IDS = [
  "club:fohenagh-historic",
  "club:ahascragh-historic",
] as const;

export type DualEraStripEntry = {
  summary: EntitySummary;
  /**
   * Older-club chips on the amalgam page. The amalgam chip on a historic page
   * only when `club` or `also_club` is Ahascragh-Fohenagh.
   */
  chips: ClubChipData[];
  /** True when seed `club` or `also_club` is the amalgam. `club_1` is not. */
  afPrimary: boolean;
};

/**
 * Playing link: `club` or `also_club` names Ahascragh-Fohenagh.
 * Those are the primary jersey fields `playerClubIds` reads first.
 * A numbered extra such as `club_1` is a link, not a jersey claim.
 */
function afIsPrimaryJersey(attrs: Record<string, TripleVal>): boolean {
  return ["club", "also_club"].some((key) =>
    parseClubIds(attrs[key]).includes(AF_CLUB_ID)
  );
}

/**
 * Verified dual-era players for one of the three locked club pages.
 * Wording comes from seed club fields only. Needs-check players stay in the roster.
 */
export function verifiedDualEraStrip(
  clubId: string,
  rows: ClubRosterRow[],
  A: AssocArray
): DualEraStripEntry[] {
  const amalgam = clubId === AF_CLUB_ID;
  const historic =
    clubId === "club:fohenagh-historic" ||
    clubId === "club:ahascragh-historic";
  if (!amalgam && !historic) return [];

  const entries: DualEraStripEntry[] = [];
  for (const row of rows) {
    if (row.trust !== "Verified") continue;
    const attrs = A.entityAttrs(row.summary.id);
    const ids = playerClubIds(attrs);
    const historicIds = HISTORIC_CLUB_IDS.filter((id) => ids.includes(id));
    if (!ids.includes(clubId) || !ids.includes(AF_CLUB_ID)) continue;
    if (historicIds.length === 0) continue;
    const afPrimary = afIsPrimaryJersey(attrs);
    const chipIds = amalgam ? historicIds : afPrimary ? [AF_CLUB_ID] : [];
    entries.push({
      summary: row.summary,
      chips: chipIds.map((id) => toClubChip(id, A)),
      afPrimary,
    });
  }
  return entries;
}

function valueMentionsClub(val: TripleVal, clubId: string): boolean {
  return parseClubIds(val).includes(clubId);
}

/**
 * Jersey claim that is only an unsourced numbered or season extra.
 * A named column (`club`, `also_club`, …) is the player's existing jersey
 * and is not treated as a pending add.
 */
function jerseyLinkPending(
  attrs: Record<string, TripleVal>,
  clubId: string
): boolean {
  const cols = Object.entries(attrs)
    .filter(
      ([key, val]) => isClubAttrColumn(key) && parseClubIds(val).includes(clubId)
    )
    .map(([key]) => key);
  if (cols.length === 0) return false;
  const named = cols.filter(
    (col) => !isNumberedClubCol(col) && !isSeasonClubCol(col)
  );
  if (named.length > 0) return false;
  return cols.every((col) => {
    const source = attrs[`source_${col}`];
    return typeof source !== "string" || source.trim() === "";
  });
}

function addPlayerFromRow(
  row: string,
  val: TripleVal,
  clubId: string,
  A: AssocArray,
  playerIds: Set<string>
): void {
  if (!valueMentionsClub(val, clubId)) return;
  if (row.startsWith("player:")) {
    if (!A.entityAttrs(row).same_as) playerIds.add(row);
    return;
  }
  if (row.startsWith("appearance:")) {
    const player = A.get(row, "player");
    if (typeof player === "string" && player.startsWith("player:")) {
      if (!A.entityAttrs(player).same_as) playerIds.add(player);
    }
  }
}

/** Players who wore this club's jersey (attrs + appearances). */
export async function listClubRoster(
  clubId: string,
  A: AssocArray
): Promise<ClubRosterRow[]> {
  const playerIds = new Set<string>();

  for (const col of A.cols()) {
    if (!isClubAttrColumn(col)) continue;
    for (const t of A.getcol(col)) {
      addPlayerFromRow(t.row, t.val, clubId, A, playerIds);
    }
  }

  const cuttingCounts = await linkedCuttingCountsFor(playerIds);
  const rows: ClubRosterRow[] = [];
  for (const id of playerIds) {
    const summary = summarizeEntity(id, A);
    if (!summary || summary.kind !== "player") continue;
    const attrs = A.entityAttrs(id);
    const also = sortClubIds(
      collectClubIdsFromAttrs(attrs).filter((c) => c !== clubId)
    ).map((c) => toClubChip(c, A));
    const linkedCuttings = Math.max(
      cuttingCounts.get(id) ?? 0,
      linkedCuttingCount(attrs)
    );
    rows.push({
      summary,
      alsoClubs: also,
      trust:
        playerProfileChip(attrs, summary.confidence, linkedCuttings) ??
        "Still checking",
      linkPending: jerseyLinkPending(attrs, clubId),
    });
  }

  rows.sort((a, b) => {
    const va = a.trust === "Verified" ? 0 : 1;
    const vb = b.trust === "Verified" ? 0 : 1;
    if (va !== vb) return va - vb;
    return a.summary.title.localeCompare(b.summary.title);
  });

  return rows;
}
