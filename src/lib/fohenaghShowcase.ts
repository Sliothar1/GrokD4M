/**
 * Homepage and Fohenagh club showcase.
 * Ids already in the seed. Nothing here mints a player.
 */

export const HERO_CUTTING_ID = "art-ct-1959-09-05-fohenagh-castlegar-portrait";
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
 * Owner order for the Fohenagh greats shelf.
 * Numbers are not shown on the page.
 * Eric Lally, Mike Glynn, Mike Coen (the later player) and Conor Ford
 * are omitted: no player id in the seed.
 */
export const FOHENAGH_GREATS = [
  "player:john-devine",
  "player:tony-kirwan-fohenagh",
  "player:alan-madden",
  "player:gerry-madden-fohenagh",
  "player:raymond-higgins-fohenagh",
  "player:jason-lohan",
  "player:noel-higgins-ahascragh-fohenagh",
  "player:m-barrett-fohenagh",
  "player:ollie-deeley",
  "player:sean-moclair",
  "player:seamus-moclair",
  "player:cathal-lohan",
  "player:sean-keane-fohenagh",
  "player:declan-glynn-ahascragh-fohenagh",
] as const;

export function team1959Hint(id: string): string | undefined {
  if (id === "player:tony-ogorman") return "1959 goal";
  if (id === "player:tim-sweeney-fohenagh") return "1959 · 1-4";
  if (id === "player:mick-coen-fohenagh") return "1959 XV";
  return undefined;
}

export const SWEENEY_PROFILE_IDS = new Set([
  "player:tim-sweeney-fohenagh",
  "player:patrick-sweeney-fohenagh",
  "player:jim-sweeney",
  "player:gerry-sweeney-fohenagh",
]);

const JUVENILE =
  /under-?\s*1[246]|u-?\s*1[246]|minor|juvenile|schools|colleges/i;

/** Card line from cited prose. Skips relationship claims and, where an adult Fohenagh line exists, underage notes. */
export function citedCardLine(
  notable?: string | null,
  note?: string | null
): string {
  const text = [notable, note].filter(Boolean).join(" ");
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const clean = sentences.filter(
    (s) => !/\b(brother of|son of|father of)\b/i.test(s)
  );
  const adult = clean.find(
    (s) => /fohenagh/i.test(s) && !JUVENILE.test(s)
  );
  return (adult || clean[0] || "").replace(/\s+/g, " ");
}

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
