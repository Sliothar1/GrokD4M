import type { CorrectionSubmission } from "./types";

const PAGE_RE = /^\/(player|club)\/[a-z0-9][a-z0-9-]{0,120}$/;
const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[^\s@<>]{2,}$/;

export const LIMITS = { whatsWrongMin: 10, whatsWrongMax: 4000, url: 500, name: 100, email: 200 };

/** Minimum time (ms) between form render and submit; faster = bot. */
export const MIN_FILL_MS = 3000;

function clean(v: unknown, max: number): string {
  return String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function normalisePage(raw: unknown): string | null {
  const p = clean(raw, 200).split(/[?#]/)[0];
  return PAGE_RE.test(p) ? p : null;
}

export type ValidationResult =
  | { ok: true; value: Omit<CorrectionSubmission, "id" | "receivedAt" | "status"> }
  | { ok: false; error: string };

export function validateSubmission(input: Record<string, unknown>): ValidationResult {
  const page = normalisePage(input.page);
  if (!page) return { ok: false, error: "Please use the link on a player or club page." };

  const whatsWrong = clean(input.whatsWrong, LIMITS.whatsWrongMax);
  if (whatsWrong.length < LIMITS.whatsWrongMin) {
    return { ok: false, error: "Please tell us what's wrong (at least a short sentence)." };
  }

  const sourceUrl = clean(input.sourceUrl, LIMITS.url);
  if (sourceUrl && !/^https?:\/\/[^\s]+$/i.test(sourceUrl)) {
    return { ok: false, error: "The source link should start with http:// or https://" };
  }

  const name = clean(input.name, LIMITS.name);
  const email = clean(input.email, LIMITS.email);
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "That email address doesn't look right (it's optional)." };
  }

  const removalRequest = input.removalRequest === true || input.removalRequest === "on" || input.removalRequest === "true";

  return {
    ok: true,
    value: {
      page,
      whatsWrong,
      sourceUrl: sourceUrl || undefined,
      removalRequest,
      priority: removalRequest ? "removal" : "correction",
      name: name || undefined,
      email: email || undefined,
    },
  };
}
