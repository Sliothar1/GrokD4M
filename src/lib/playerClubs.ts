import {
  displayNameForRef,
  entityHref,
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

const CLUB_ATTR_COLS = [
  "club",
  "clubs",
  "club_history",
  "also_club",
  "historic_club",
  "parish_club",
] as const;

export type ClubChipData = {
  id: string;
  name: string;
  href: string;
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
  for (const col of CLUB_ATTR_COLS) {
    for (const id of parseClubIds(attrs[col])) ids.add(id);
  }
  for (const [key, val] of Object.entries(attrs)) {
    if (/^season:\d{4}$/.test(key) || /^club_\d+$/.test(key)) {
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

/** Kid-facing chip label. Historic predecessors stay distinct from the amalgam. */
export function clubChipLabel(clubId: string, A: AssocArray): string {
  const name = displayNameForRef(clubId, A);
  if (
    clubId === "club:fohenagh-historic" ||
    clubId === "club:ahascragh-historic"
  ) {
    return `${name} · historic`;
  }
  return name;
}

export function toClubChip(clubId: string, A: AssocArray): ClubChipData {
  return {
    id: clubId,
    name: clubChipLabel(clubId, A),
    href: entityHref(clubId, "club"),
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

  return sortClubIds([...ids])
    .filter((id) => Object.keys(A.entityAttrs(id)).length > 0)
    .map((id) => toClubChip(id, A));
}

export type ClubRosterRow = {
  summary: EntitySummary;
  alsoClubs: ClubChipData[];
};

function valueMentionsClub(val: TripleVal, clubId: string): boolean {
  return parseClubIds(val).includes(clubId);
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
export function listClubRoster(clubId: string, A: AssocArray): ClubRosterRow[] {
  const playerIds = new Set<string>();

  for (const col of CLUB_ATTR_COLS) {
    for (const t of A.getcol(col)) {
      addPlayerFromRow(t.row, t.val, clubId, A, playerIds);
    }
  }

  for (const col of A.cols()) {
    if (!/^season:\d{4}$/.test(col) && !/^club_\d+$/.test(col)) continue;
    for (const t of A.getcol(col)) {
      addPlayerFromRow(t.row, t.val, clubId, A, playerIds);
    }
  }

  const rows: ClubRosterRow[] = [];
  for (const id of playerIds) {
    const summary = summarizeEntity(id, A);
    if (!summary || summary.kind !== "player") continue;
    const attrs = A.entityAttrs(id);
    const also = sortClubIds(
      collectClubIdsFromAttrs(attrs).filter((c) => c !== clubId)
    ).map((c) => toClubChip(c, A));
    rows.push({ summary, alsoClubs: also });
  }

  rows.sort((a, b) => {
    const va = a.summary.trustLabel === "Verified" ? 0 : 1;
    const vb = b.summary.trustLabel === "Verified" ? 0 : 1;
    if (va !== vb) return va - vb;
    return a.summary.title.localeCompare(b.summary.title);
  });

  return rows;
}
