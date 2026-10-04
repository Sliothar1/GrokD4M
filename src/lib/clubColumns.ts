/**
 * One club-column list for player chips and club rosters.
 * `club_N` is any `/^club_\d+$/`. Season edges stay in the same predicate.
 */
export const NAMED_CLUB_ATTR_COLS = [
  "club",
  "clubs",
  "club_history",
  "also_club",
  "also_played",
  "historic_club",
  "parish_club",
] as const;

const NUMBERED_CLUB_COL = /^club_\d+$/;
const SEASON_CLUB_COL = /^season:\d{4}$/;

export function isNumberedClubCol(col: string): boolean {
  return NUMBERED_CLUB_COL.test(col);
}

export function isSeasonClubCol(col: string): boolean {
  return SEASON_CLUB_COL.test(col);
}

/** Columns that may hold a `club:…` id. Shared by `playerClubIds` and rosters. */
export function isClubAttrColumn(col: string): boolean {
  return (
    (NAMED_CLUB_ATTR_COLS as readonly string[]).includes(col) ||
    isNumberedClubCol(col) ||
    isSeasonClubCol(col)
  );
}

export function numberedClubColIndex(col: string): number {
  if (col === "club") return 0;
  const m = col.match(/^club_(\d+)$/);
  return m ? Number(m[1]) : 99;
}

/**
 * Human names for club fact columns shown on club pages.
 * Division's value is formatted separately by `formatDivision`.
 */
export const CLUB_COLUMN_LABELS: Record<string, string> = {
  parish: "Parish",
  colours: "Colours",
  county_titles: "County titles",
  division: "Division",
};

/**
 * Readable label when a column has no specific name.
 * Underscores become spaces. Only the first letter is capitalised.
 */
export function prettifyColumnLabel(key: string): string {
  const spaced = key.replace(/_/g, " ").trim();
  if (!spaced) return spaced;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function clubColumnLabel(key: string): string {
  return CLUB_COLUMN_LABELS[key] ?? prettifyColumnLabel(key);
}
