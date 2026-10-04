import { del, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  CORRECTIONS_PREFIX,
  correctionsStoreId,
  correctionsStoreToken,
  isPrivateBlobUrl,
} from "./config";
import type { CorrectionSubmission } from "./types";

export class StoreNotConfiguredError extends Error {
  constructor() {
    super("Private corrections store is not configured.");
  }
}

/** Removal requests sort first in the queue (p0-…), corrections after (p1-…). */
export function queuePathname(s: CorrectionSubmission): string {
  const p = s.priority === "removal" ? "p0-removal" : "p1-correction";
  const ts = s.receivedAt.replace(/[:.]/g, "-");
  return `${CORRECTIONS_PREFIX}${p}/${ts}-${s.id}.json`;
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
