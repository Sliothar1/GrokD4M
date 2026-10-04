/**
 * Columns the public site must never render or send to the client.
 * `audit_*` is server-only (family-confirmation notes and similar).
 * `source_audit_*` would cite that private text, so it stays with it.
 */

import type { AssocArray, Triple, TripleVal } from "@/lib/d4m/AssocArray";

/** Exact token written in family-confirmation audit text. */
export const GARRY_CONFIRMED_TOKEN = "Garry-confirmed";

export function isPrivateCol(col: string): boolean {
  return col.startsWith("audit_");
}

/** `source_<fact>` whose fact is an `audit_*` column, including suffixes. */
export function isPrivateSourceCol(col: string): boolean {
  if (!col.startsWith("source_")) return false;
  return isPrivateCol(col.slice("source_".length));
}

export function isWithheldFromClient(col: string): boolean {
  return isPrivateCol(col) || isPrivateSourceCol(col);
}

/** Public fact key named by `audit_<fact>`. `audit_note` → `note`. */
export function factKeyForAuditCol(col: string): string | null {
  if (!isPrivateCol(col)) return null;
  const fact = col.slice("audit_".length).trim();
  if (!fact || isPrivateCol(fact)) return null;
  return fact;
}

function auditTextsByRow(triples: readonly Triple[]): Map<string, string[]> {
  const auditByRow = new Map<string, string[]>();
  for (const t of triples) {
    if (!isPrivateCol(t.col) || typeof t.val !== "string") continue;
    const text = t.val.trim();
    if (text.length < 8) continue;
    const list = auditByRow.get(t.row);
    if (list) list.push(text);
    else auditByRow.set(t.row, [text]);
  }
  return auditByRow;
}

/**
 * A source cell whose column or value points at audit text.
 * Public notes are not source columns and are left alone.
 */
export function sourceValueCarriesAudit(
  col: string,
  value: unknown,
  auditTexts: readonly string[]
): boolean {
  if (isPrivateSourceCol(col)) return true;
  if (!col.startsWith("source_") || typeof value !== "string") return false;
  if (auditTexts.some((text) => value.includes(text))) return true;
  if (
    value.includes(GARRY_CONFIRMED_TOKEN) &&
    auditTexts.some((text) => text.includes(GARRY_CONFIRMED_TOKEN))
  ) {
    return true;
  }
  return false;
}

export function auditTextsFromAttrs(attrs: Record<string, unknown>): string[] {
  const texts: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (!isPrivateCol(key) || typeof value !== "string") continue;
    const text = value.trim();
    if (text.length >= 8) texts.push(text);
  }
  return texts;
}

function withheldTriple(t: Triple, auditTexts: readonly string[]): boolean {
  if (isWithheldFromClient(t.col)) return true;
  return sourceValueCarriesAudit(t.col, t.val, auditTexts);
}

/** Triples safe to render, search, and put in a client payload. Order kept. */
export function publicTriples(triples: readonly Triple[]): Triple[] {
  const auditByRow = auditTextsByRow(triples);
  return triples.filter(
    (t) => !withheldTriple(t, auditByRow.get(t.row) ?? [])
  );
}

export function entityAttrsPublic(
  A: AssocArray,
  row: string
): Record<string, TripleVal> {
  const out: Record<string, TripleVal> = {};
  for (const t of publicTriples(A.getrow(row))) out[t.col] = t.val;
  return out;
}

export function getrowPublic(A: AssocArray, row: string): Triple[] {
  return publicTriples(A.getrow(row));
}

/**
 * Audit columns for server-side checks (family confirmation).
 * Never pass this object to a client component, a metadata string,
 * or any other payload the browser receives.
 */
export function getPrivateAttrs(
  A: AssocArray,
  row: string
): Record<string, TripleVal> {
  const out: Record<string, TripleVal> = {};
  for (const t of A.getrow(row)) {
    if (isPrivateCol(t.col)) out[t.col] = t.val;
  }
  return out;
}

/** AssocArray search over public triples only. Same matching rules. */
export function searchPublic(
  A: AssocArray,
  query: string
): { triples: Triple[]; rows: string[]; cols: string[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { triples: [], rows: [], cols: [] };
  const tokens = q.split(/\s+/).filter(Boolean);
  const hits = publicTriples(A.toTriples()).filter((t) => {
    const hay = `${t.row} ${t.col} ${String(t.val)}`.toLowerCase();
    return tokens.every((tok) => hay.includes(tok));
  });
  return {
    triples: hits.map((t) => ({ ...t })),
    rows: [...new Set(hits.map((t) => t.row))].sort(),
    cols: [...new Set(hits.map((t) => t.col))].sort(),
  };
}
