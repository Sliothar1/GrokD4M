import { createHash } from "node:crypto";

/**
 * Simple in-memory rate limit (per serverless instance). Keys are a salted
 * hash of the client IP, held in memory only — never stored or logged.
 * Limits: 3 per 10 minutes and 10 per day per client; 60 per hour per instance.
 */
const WINDOWS = [
  { ms: 10 * 60 * 1000, max: 3 },
  { ms: 24 * 60 * 60 * 1000, max: 10 },
];
const GLOBAL = { ms: 60 * 60 * 1000, max: 60 };

const hits = new Map<string, number[]>();
let globalHits: number[] = [];
const SALT = `${process.env.CORRECTIONS_RL_SALT || ""}:${Math.random()}`;

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(SALT + ip).digest("hex").slice(0, 32);
}

export function rateLimit(key: string, now = Date.now()): { ok: boolean; retryAfterS?: number } {
  globalHits = globalHits.filter((t) => now - t < GLOBAL.ms);
  if (globalHits.length >= GLOBAL.max) return { ok: false, retryAfterS: 600 };

  const longest = Math.max(...WINDOWS.map((w) => w.ms));
  const list = (hits.get(key) || []).filter((t) => now - t < longest);
  for (const w of WINDOWS) {
    const inWin = list.filter((t) => now - t < w.ms);
    if (inWin.length >= w.max) {
      const retry = Math.ceil((w.ms - (now - inWin[0])) / 1000);
      hits.set(key, list);
      return { ok: false, retryAfterS: retry };
    }
  }
  list.push(now);
  hits.set(key, list);
  globalHits.push(now);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < longest)) hits.delete(k);
  }
  return { ok: true };
}
