import { del, get, list, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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
