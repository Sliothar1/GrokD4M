import type { TripleVal } from "@/lib/d4m/AssocArray";

const DEATH = /\b(died|death|passed away|funeral|r\.i\.p\.?|\brip\b)\b/i;

/**
 * Canonical fields win. Alias fields fill the gaps.
 * A second note is kept beside the first. Death lines are not copied.
 */
export function mergePlayerAttrRecords(
  canonical: Record<string, TripleVal>,
  alias: Record<string, TripleVal>
): Record<string, TripleVal> {
  const out: Record<string, TripleVal> = { ...canonical };
  for (const [key, val] of Object.entries(alias)) {
    if (key === "same_as" || key === "type" || val == null || val === "") continue;
    const text = String(val);
    if (DEATH.test(text)) continue;
    if (key === "source" && /rip/i.test(text)) continue;
    if (out[key] == null || out[key] === "") {
      out[key] = val;
      continue;
    }
    if (String(out[key]) === text) continue;
    if (/^(?:note|notes|notable|book_note)(?:_\d+)?$/.test(key) && !String(out[key]).includes(text)) {
      const already = Object.values(out).some((existing) => String(existing).includes(text));
      if (already) continue;
      let n = 2;
      while (out[`book_note_${n}`] != null) n += 1;
      out[`book_note_${n}`] = val;
    }
  }
  const requestedClub = String(alias.club ?? "");
  if (requestedClub === "club:fohenagh-historic" && String(out.club ?? "") !== requestedClub) {
    const previous = String(out.club ?? "");
    if (previous && previous !== requestedClub) {
      const alreadyKept = Object.entries(out).some(
        ([key, val]) => key !== "club" && String(val) === previous
      );
      if (!alreadyKept) {
        let n = 1;
        while (out[`club_${n}`] != null && String(out[`club_${n}`]) !== "") n += 1;
        out[`club_${n}`] = previous;
      }
    }
    out.club = requestedClub;
  }
  delete out.same_as;
  return out;
}
