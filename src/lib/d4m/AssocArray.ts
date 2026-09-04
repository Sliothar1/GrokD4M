/**
 * D4M-inspired Associative Array (TypeScript).
 *
 * Inspired by MIT Lincoln Laboratory's D4M (Dynamic Distributed Dimensional Data Model)
 * by Jeremy Kepner et al. — https://d4m.mit.edu/
 *
 * Stores sparse (row, col, val) triples and supports getrow / getcol / search.
 * Values may be strings, numbers, or booleans. Empty string "" marks a logical edge.
 */

export type TripleVal = string | number | boolean;

export interface Triple {
  row: string;
  col: string;
  val: TripleVal;
}

export interface AssocQueryResult {
  triples: Triple[];
  rows: string[];
  cols: string[];
}

export class AssocArray {
  private triples: Triple[] = [];
  private rowIndex = new Map<string, Triple[]>();
  private colIndex = new Map<string, Triple[]>();

  constructor(seed?: Triple[]) {
    if (seed?.length) {
      this.insert(seed);
    }
  }

  /** Insert one or many triples. Replaces existing (row,col) if present. */
  insert(input: Triple | Triple[]): void {
    const list = Array.isArray(input) ? input : [input];
    for (const t of list) {
      this.removePair(t.row, t.col);
      const copy: Triple = { row: t.row, col: t.col, val: t.val };
      this.triples.push(copy);
      this.pushIndex(this.rowIndex, t.row, copy);
      this.pushIndex(this.colIndex, t.col, copy);
    }
  }

  /** All triples whose row equals `row`. */
  getrow(row: string): Triple[] {
    return [...(this.rowIndex.get(row) ?? [])];
  }

  /** All triples whose col equals `col`. */
  getcol(col: string): Triple[] {
    return [...(this.colIndex.get(col) ?? [])];
  }

  /** Value at (row, col), or undefined. */
  get(row: string, col: string): TripleVal | undefined {
    return this.rowIndex.get(row)?.find((t) => t.col === col)?.val;
  }

  /** Every distinct row key. */
  rows(): string[] {
    return [...this.rowIndex.keys()].sort();
  }

  /** Every distinct col key. */
  cols(): string[] {
    return [...this.colIndex.keys()].sort();
  }

  /** Number of stored triples. */
  nnz(): number {
    return this.triples.length;
  }

  /** Export a shallow copy of all triples. */
  toTriples(): Triple[] {
    return this.triples.map((t) => ({ ...t }));
  }

  /**
   * Simple case-insensitive search across row, col, and string values.
   * Returns matching triples plus unique row/col ids hit.
   */
  search(query: string): AssocQueryResult {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { triples: [], rows: [], cols: [] };
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    const hits = this.triples.filter((t) => {
      const hay = `${t.row} ${t.col} ${String(t.val)}`.toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    });
    const rowSet = new Set(hits.map((t) => t.row));
    const colSet = new Set(hits.map((t) => t.col));
    return {
      triples: hits.map((t) => ({ ...t })),
      rows: [...rowSet].sort(),
      cols: [...colSet].sort(),
    };
  }

  /** Rows that look like entity ids of a given type prefix, e.g. "player:". */
  entitiesOfType(prefix: string): string[] {
    const p = prefix.endsWith(":") ? prefix : `${prefix}:`;
    return this.rows().filter((r) => r.startsWith(p));
  }

  /** Collect attribute map for an entity row (col → val). */
  entityAttrs(row: string): Record<string, TripleVal> {
    const out: Record<string, TripleVal> = {};
    for (const t of this.getrow(row)) {
      out[t.col] = t.val;
    }
    return out;
  }

  private removePair(row: string, col: string): void {
    const existing = this.rowIndex.get(row)?.find((t) => t.col === col);
    if (!existing) return;
    this.triples = this.triples.filter((t) => !(t.row === row && t.col === col));
    this.rowIndex.set(
      row,
      (this.rowIndex.get(row) ?? []).filter((t) => t.col !== col)
    );
    this.colIndex.set(
      col,
      (this.colIndex.get(col) ?? []).filter((t) => t.row !== row)
    );
    if ((this.rowIndex.get(row) ?? []).length === 0) this.rowIndex.delete(row);
    if ((this.colIndex.get(col) ?? []).length === 0) this.colIndex.delete(col);
  }

  private pushIndex(map: Map<string, Triple[]>, key: string, triple: Triple): void {
    const list = map.get(key);
    if (list) list.push(triple);
    else map.set(key, [triple]);
  }
}

/** Load an AssocArray from a JSON array of {row,col,val} objects. */
export function loadAssocFromJson(data: unknown): AssocArray {
  if (!Array.isArray(data)) {
    throw new Error("Seed must be a JSON array of triples");
  }
  const triples: Triple[] = data.map((item, i) => {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as Triple).row !== "string" ||
      typeof (item as Triple).col !== "string" ||
      !("val" in (item as object))
    ) {
      throw new Error(`Invalid triple at index ${i}`);
    }
    return {
      row: (item as Triple).row,
      col: (item as Triple).col,
      val: (item as Triple).val,
    };
  });
  return new AssocArray(triples);
}
