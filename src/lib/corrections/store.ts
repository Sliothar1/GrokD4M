import { del, get, list, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  APPROVED_PREFIX,
  CORRECTIONS_PREFIX,
  correctionsStoreId,
  correctionsStoreToken,
  isPrivateBlobUrl,
} from "./config";
import {
  approvedFolder,
  toPublicTerraceNote,
  type CorrectionSubmission,
  type PublicTerraceNote,
} from "./types";

export class StoreNotConfiguredError extends Error {
  constructor() {
    super("Private corrections store is not configured.");
  }
}

/** Removal requests sort first (p0-…), corrections next (p1-…), memories last (p2-…). */
export function queuePathname(s: CorrectionSubmission): string {
  const p =
    s.priority === "removal" ? "p0-removal" : s.priority === "memory" ? "p2-memory" : "p1-correction";
  const ts = s.receivedAt.replace(/[:.]/g, "-");
  return `${CORRECTIONS_PREFIX}${p}/${ts}-${s.id}.json`;
}

export function approvedPathname(page: string, id: string): string {
  return `${APPROVED_PREFIX}${approvedFolder(page)}/${id}.json`;
}

export function newSubmission(
  v: Omit<CorrectionSubmission, "id" | "receivedAt" | "status">
): CorrectionSubmission {
  return { id: randomUUID().slice(0, 12), receivedAt: new Date().toISOString(), status: "open", ...v };
}

/**
 * Save to the PRIVATE store. On Vercel this must be a private Blob store
 * (access: "private"); nothing is ever written to the public cuttings store.
 * Local dev without a token writes to ./.corrections-local/ (gitignored).
 */
export async function saveSubmission(s: CorrectionSubmission): Promise<{ pathname: string }> {
  const pathname = queuePathname(s);
  const body = JSON.stringify(s, null, 2);
  const token = correctionsStoreToken();
  const storeId = correctionsStoreId();
  if (token || storeId) {
    if (!storeId) throw new StoreNotConfiguredError(); // fail closed: never fall back to BLOB_STORE_ID (public)
    const blob = await put(pathname, body, {
      access: "private",
      token,
      storeId,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    // Defence in depth: if it somehow landed anywhere but a private store, remove it.
    if (!isPrivateBlobUrl(blob.url)) {
      await del(blob.url, { token, storeId }).catch(() => undefined);
      throw new Error("corrections store is not private");
    }
    return { pathname };
  }
  if (process.env.VERCEL) throw new StoreNotConfiguredError();
  const file = path.join(process.cwd(), ".corrections-local", pathname);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, body, "utf8");
  return { pathname };
}

/**
 * Approved terrace notes for one player page.
 * Reads only the approved prefix. Returns id + text. Never name or email.
 * Empty when the private store is not configured (nothing is invented).
 */
export async function listApprovedMemories(page: string): Promise<PublicTerraceNote[]> {
  const prefix = `${APPROVED_PREFIX}${approvedFolder(page)}/`;
  try {
    const bodies = await readApprovedBodies(prefix);
    const notes: PublicTerraceNote[] = [];
    for (const raw of bodies) {
      if (raw && typeof raw === "object" && "page" in raw) {
        const stored = (raw as { page?: unknown }).page;
        if (typeof stored === "string" && stored !== page) continue;
      }
      const note = toPublicTerraceNote(raw);
      if (note) notes.push(note);
    }
    return notes;
  } catch (e) {
    console.error("memories: list failed", e instanceof Error ? e.name : "error");
    return [];
  }
}

async function readApprovedBodies(prefix: string): Promise<unknown[]> {
  const token = correctionsStoreToken();
  const storeId = correctionsStoreId();
  if (token || storeId) {
    if (!storeId) return [];
    const out: unknown[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 100, token, storeId });
      for (const blob of page.blobs) {
        if (!isPrivateBlobUrl(blob.url)) continue;
        const got = await get(blob.pathname, { access: "private", token, storeId, useCache: false });
        if (!got || got.statusCode !== 200 || !got.stream) continue;
        out.push(JSON.parse(await new Response(got.stream).text()) as unknown);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  }
  if (process.env.VERCEL) return [];
  const dir = path.join(process.cwd(), ".corrections-local", prefix);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(path.join(dir, name), "utf8")) as unknown);
}

export type OpenQueueRow = {
  id: string;
  receivedAt: string;
  priority: string;
  requestKind: string;
  page: string;
  excerpt: string;
  memory: boolean;
};

type StoredOpen = {
  id?: string;
  receivedAt?: string;
  priority?: string;
  requestKind?: string;
  page?: string;
  whatsWrong?: string;
};

const LOCAL_ROOT = path.join(process.cwd(), ".corrections-local");
const PROPOSALS_PREFIX = "corrections/proposals/";

function walkJson(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) out.push(...walkJson(file));
    else if (name.endsWith(".json")) out.push(file);
  }
  return out;
}

function toQueueRow(raw: StoredOpen): OpenQueueRow | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  const page = typeof raw.page === "string" ? raw.page : "";
  if (!id || !page) return null;
  const requestKind = typeof raw.requestKind === "string" ? raw.requestKind : "";
  const priority = typeof raw.priority === "string" ? raw.priority : "";
  const text = typeof raw.whatsWrong === "string" ? raw.whatsWrong : "";
  return {
    id,
    receivedAt: typeof raw.receivedAt === "string" ? raw.receivedAt : "",
    priority,
    requestKind,
    page,
    excerpt: text.replace(/\s+/g, " ").slice(0, 160),
    memory: requestKind === "memory" || priority === "memory",
  };
}

async function privateAuth(): Promise<{ token?: string; storeId: string } | "local" | "unconfigured"> {
  const token = correctionsStoreToken();
  const storeId = correctionsStoreId();
  if (token || storeId) {
    if (!storeId) return "unconfigured";
    return { token, storeId };
  }
  if (process.env.VERCEL) return "unconfigured";
  return "local";
}

/** Open queue for the editor. Name and email are never returned. */
export async function listOpenQueue(): Promise<OpenQueueRow[]> {
  const auth = await privateAuth();
  if (auth === "unconfigured") throw new StoreNotConfiguredError();
  const raws: StoredOpen[] = [];
  if (auth === "local") {
    for (const file of walkJson(path.join(LOCAL_ROOT, CORRECTIONS_PREFIX))) {
      raws.push(JSON.parse(readFileSync(file, "utf8")) as StoredOpen);
    }
  } else {
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: CORRECTIONS_PREFIX, cursor, limit: 100, token: auth.token, storeId: auth.storeId });
      for (const blob of page.blobs) {
        if (!isPrivateBlobUrl(blob.url)) continue;
        const got = await get(blob.pathname, { access: "private", token: auth.token, storeId: auth.storeId, useCache: false });
        if (!got || got.statusCode !== 200 || !got.stream) continue;
        raws.push(JSON.parse(await new Response(got.stream).text()) as StoredOpen);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }
  return raws
    .map(toQueueRow)
    .filter((row): row is OpenQueueRow => Boolean(row))
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
}

async function findOpenPath(id: string): Promise<{ pathname: string; raw: StoredOpen } | null> {
  const auth = await privateAuth();
  if (auth === "unconfigured") throw new StoreNotConfiguredError();
  if (auth === "local") {
    for (const file of walkJson(path.join(LOCAL_ROOT, CORRECTIONS_PREFIX))) {
      const raw = JSON.parse(readFileSync(file, "utf8")) as StoredOpen;
      if (raw.id === id) return { pathname: path.relative(LOCAL_ROOT, file), raw };
    }
    return null;
  }
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: CORRECTIONS_PREFIX, cursor, limit: 100, token: auth.token, storeId: auth.storeId });
    for (const blob of page.blobs) {
      if (!blob.pathname.endsWith(`-${id}.json`)) continue;
      const got = await get(blob.pathname, { access: "private", token: auth.token, storeId: auth.storeId, useCache: false });
      if (!got || got.statusCode !== 200 || !got.stream) continue;
      const raw = JSON.parse(await new Response(got.stream).text()) as StoredOpen;
      if (raw.id === id) return { pathname: blob.pathname, raw };
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return null;
}

async function removePath(pathname: string): Promise<void> {
  const auth = await privateAuth();
  if (auth === "unconfigured") throw new StoreNotConfiguredError();
  if (auth === "local") {
    rmSync(path.join(LOCAL_ROOT, pathname));
    return;
  }
  await del(pathname, { token: auth.token, storeId: auth.storeId });
}

/** Memories only: copy the text, drop name and email, delete the open item. */
export async function approveOpenMemory(id: string): Promise<void> {
  const found = await findOpenPath(id);
  if (!found) throw new Error("That queue item is not open.");
  const row = toQueueRow(found.raw);
  if (!row?.memory) throw new Error("Approve is for a memory. Reject deletes a correction.");
  const record = {
    id: row.id,
    page: row.page,
    text: found.raw.whatsWrong ?? "",
    approvedAt: new Date().toISOString(),
  };
  const pathname = approvedPathname(record.page, record.id);
  const body = JSON.stringify(record, null, 2);
  const auth = await privateAuth();
  if (auth === "local") {
    const file = path.join(LOCAL_ROOT, pathname);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body, "utf8");
  } else if (auth !== "unconfigured") {
    const blob = await put(pathname, body, {
      access: "private",
      token: auth.token,
      storeId: auth.storeId,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    if (!isPrivateBlobUrl(blob.url)) {
      await del(blob.url, { token: auth.token, storeId: auth.storeId }).catch(() => undefined);
      throw new Error("corrections store is not private");
    }
  }
  await removePath(found.pathname);
}

/** Delete an open item. Same as the queue CLI resolve. */
export async function rejectOpenItem(id: string): Promise<void> {
  const found = await findOpenPath(id);
  if (!found) throw new Error("That queue item is not open.");
  await removePath(found.pathname);
}

export type EditorProposal = {
  id: string;
  receivedAt: string;
  entity: "player" | "game" | "clipping";
  action: "create" | "update" | "delete";
  target: string;
  note: string;
};

/** Queue a seed change. Does not write data/seed.json. */
export async function saveEditorProposal(
  input: Omit<EditorProposal, "id" | "receivedAt">
): Promise<{ pathname: string }> {
  const proposal: EditorProposal = {
    id: randomUUID().slice(0, 12),
    receivedAt: new Date().toISOString(),
    ...input,
  };
  const pathname = `${PROPOSALS_PREFIX}${proposal.receivedAt.replace(/[:.]/g, "-")}-${proposal.id}.json`;
  const body = JSON.stringify(proposal, null, 2);
  const auth = await privateAuth();
  if (auth === "unconfigured") throw new StoreNotConfiguredError();
  if (auth === "local") {
    const file = path.join(LOCAL_ROOT, pathname);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body, "utf8");
    return { pathname };
  }
  const blob = await put(pathname, body, {
    access: "private",
    token: auth.token,
    storeId: auth.storeId,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: false,
  });
  if (!isPrivateBlobUrl(blob.url)) {
    await del(blob.url, { token: auth.token, storeId: auth.storeId }).catch(() => undefined);
    throw new Error("corrections store is not private");
  }
  return { pathname };
}
