/**
 * Thin marine wrapper around the D4M-inspired AssocArray.
 *
 * Same engine as HurlingWiki: sparse (row, col, val) triples with getrow / getcol / search.
 * Marine rows use two shapes:
 *   station:{id}                  e.g. "station:gubbaros"
 *   {year}-W{week}@{location}     e.g. "2018-W25@gubbaros"
 *   col = feature name            e.g. "sst", "in_mhw", "hab_cells"
 *   val = number (observations) or string (station metadata)
 */

import {
  AssocArray,
  loadAssocFromJson,
  type AssocQueryResult,
  type Triple,
  type TripleVal,
} from "@/lib/d4m/AssocArray";

export type { Triple, TripleVal, AssocQueryResult };

/** Canonical D4M row for a station entity. */
export function stationRow(id: string): string {
  return `station:${id}`;
}

/** Canonical D4M row for a location-week. Week is ISO-8601, zero-padded. */
export function marineRow(
  year: number,
  week: number,
  locationId: string
): string {
  const w = String(week).padStart(2, "0");
  return `${year}-W${w}@${locationId}`;
}

export function parseMarineRow(
  row: string
): { year: number; week: number; locationId: string } | null {
  const m = /^(\d{4})-W(\d{1,2})@(.+)$/.exec(row);
  if (!m) return null;
  return {
    year: Number(m[1]),
    week: Number(m[2]),
    locationId: m[3],
  };
}

export class AssocMarine {
  private readonly A: AssocArray;

  constructor(seed?: Triple[]) {
    this.A = new AssocArray(seed);
  }

  insert(input: Triple | Triple[]): void {
    this.A.insert(input);
  }

  getrow(row: string): Triple[] {
    return this.A.getrow(row);
  }

  getcol(col: string): Triple[] {
    return this.A.getcol(col);
  }

  get(row: string, col: string): TripleVal | undefined {
    return this.A.get(row, col);
  }

  search(query: string): AssocQueryResult {
    return this.A.search(query);
  }

  rows(): string[] {
    return this.A.rows();
  }

  cols(): string[] {
    return this.A.cols();
  }

  nnz(): number {
    return this.A.nnz();
  }

  toTriples(): Triple[] {
    return this.A.toTriples();
  }

  entityAttrs(row: string): Record<string, TripleVal> {
    return this.A.entityAttrs(row);
  }

  /** Numeric feature series for one location, sorted by year then week. */
  getLocationFeature(
    locationId: string,
    feature: string
  ): Array<{ row: string; year: number; week: number; val: number }> {
    const out: Array<{ row: string; year: number; week: number; val: number }> =
      [];
    for (const t of this.A.getcol(feature)) {
      const parsed = parseMarineRow(t.row);
      if (!parsed || parsed.locationId !== locationId) continue;
      if (typeof t.val !== "number") continue;
      out.push({
        row: t.row,
        year: parsed.year,
        week: parsed.week,
        val: t.val,
      });
    }
    out.sort((a, b) => a.year - b.year || a.week - b.week);
    return out;
  }

  /** All numeric features for a single week@location row. */
  getLocationWeek(
    year: number,
    week: number,
    locationId: string
  ): Record<string, TripleVal> {
    return this.A.entityAttrs(marineRow(year, week, locationId));
  }
}

export function loadAssocMarineFromJson(data: unknown): AssocMarine {
  const base = loadAssocFromJson(data);
  const marine = new AssocMarine();
  marine.insert(base.toTriples());
  return marine;
}
