export const REQUEST_KINDS = [
  "fix-detail",
  "remove-line",
  "take-down-photo",
  "add-photo",
  "other",
  "memory",
] as const;

export type RequestKind = (typeof REQUEST_KINDS)[number];

export type QueuePriority = "removal" | "correction" | "memory";

export type CorrectionSubmission = {
  id: string;
  receivedAt: string; // ISO UTC
  priority: QueuePriority;
  /** How the writer asked us to treat the note. Legacy rows may omit it. */
  requestKind?: RequestKind;
  page: string; // e.g. /player/jason-lohan
  whatsWrong: string;
  sourceUrl?: string;
  removalRequest: boolean;
  name?: string;
  email?: string;
  status: "open";
};

/**
 * Editorial copy of an approved memory. Name and email are never stored here.
 * Pending submissions stay on the open queue and are not this type.
 */
export type ApprovedMemory = {
  id: string;
  page: string;
  text: string;
  approvedAt: string;
};

/** What a player page may render. Submitter fields are not part of this shape. */
export type PublicTerraceNote = {
  id: string;
  text: string;
};

export function isRequestKind(v: string): v is RequestKind {
  return (REQUEST_KINDS as readonly string[]).includes(v);
}

export function priorityForKind(kind: RequestKind): QueuePriority {
  if (kind === "remove-line" || kind === "take-down-photo") return "removal";
  if (kind === "memory") return "memory";
  return "correction";
}

export function removalForKind(kind: RequestKind): boolean {
  return priorityForKind(kind) === "removal";
}

/** Folder key for `/player/jimmy-devine-fohenagh` → `player-jimmy-devine-fohenagh`. */
export function approvedFolder(page: string): string {
  return page.replace(/^\//, "").replace(/\//g, "-");
}

/**
 * Public note from an approved-memory file. Drops every field except id and text,
 * so a name or email on a bad file cannot reach the page.
 */
export function toPublicTerraceNote(raw: unknown): PublicTerraceNote | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const text = typeof row.text === "string" ? row.text.trim() : "";
  if (!/^[a-zA-Z0-9-]{4,40}$/.test(id)) return null;
  if (text.length < 1 || text.length > 4000) return null;
  return { id, text };
}
